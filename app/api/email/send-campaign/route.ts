import { NextRequest } from 'next/server';
import { getMailer, getFromAddress } from '@/lib/mailer';
import { getServerSupabaseClient } from '@/lib/supabase';
import { isValidEmail } from '@/lib/email-validator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Recipient {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  businessName?: string;
}

interface Body {
  campaignName: string;
  recipients: Recipient[];
}

/**
 * Streaming campaign sender. Emits one JSON line per recipient progress event,
 * plus a final `done` event. Front-end parses NDJSON to drive a live progress UI.
 */
export async function POST(req: NextRequest) {
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { campaignName, recipients } = payload;
  if (!campaignName || !Array.isArray(recipients) || recipients.length === 0) {
    return new Response('campaignName and non-empty recipients are required', { status: 400 });
  }

  let mailer: ReturnType<typeof getMailer>;
  try {
    mailer = getMailer();
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }

  const supabase = getServerSupabaseClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      let campaignId: string | null = null;
      if (supabase) {
        try {
          const { data } = await supabase
            .from('outreach_campaigns')
            .insert({
              name: campaignName,
              status: 'sending',
              total_sent: 0,
            })
            .select('id')
            .single();
          campaignId = (data as { id?: string } | null)?.id ?? null;
        } catch {
          /* ignore */
        }
      }

      send({ type: 'start', total: recipients.length, campaignId });

      let sentCount = 0;
      let failedCount = 0;
      const from = getFromAddress();

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        send({
          type: 'progress',
          index: i,
          businessName: r.businessName ?? '',
          to: r.to,
          status: 'sending',
        });

        // Validate email
        if (!isValidEmail(r.to)) {
          failedCount += 1;
          send({
            type: 'progress',
            index: i,
            businessName: r.businessName ?? '',
            to: r.to,
            status: 'failed',
            error: 'invalid email',
          });
          if (supabase) {
            try {
              await supabase.from('email_events').insert({
                lead_id: r.leadId,
                campaign_id: campaignId,
                subject: r.subject,
                body: r.body,
                event_type: 'failed',
              });
            } catch {
              /* ignore */
            }
          }
          continue;
        }

        let ok = false;
        let errMsg: string | null = null;
        try {
          await mailer.sendMail({
            from,
            to: r.to,
            subject: r.subject,
            text: r.body,
          });
          ok = true;
        } catch (err) {
          errMsg = (err as Error).message;
        }

        if (ok) sentCount += 1;
        else failedCount += 1;

        if (supabase) {
          try {
            await supabase.from('email_events').insert({
              lead_id: r.leadId,
              campaign_id: campaignId,
              subject: r.subject,
              body: r.body,
              event_type: ok ? 'sent' : 'failed',
            });
            if (ok) {
              await supabase
                .from('coffee_leads')
                .update({ email_status: 'sent' })
                .eq('id', r.leadId);
            }
          } catch {
            /* ignore */
          }
        }

        send({
          type: 'progress',
          index: i,
          businessName: r.businessName ?? '',
          to: r.to,
          status: ok ? 'sent' : 'failed',
          error: errMsg ?? undefined,
        });
      }

      if (supabase && campaignId) {
        try {
          await supabase
            .from('outreach_campaigns')
            .update({ status: 'sent', total_sent: sentCount })
            .eq('id', campaignId);
        } catch {
          /* ignore */
        }
      }

      send({
        type: 'done',
        sent: sentCount,
        failed: failedCount,
        total: recipients.length,
        campaignId,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
