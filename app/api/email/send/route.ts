import { NextRequest, NextResponse } from 'next/server';
import { getMailer, getFromAddress } from '@/lib/mailer';
import { getServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  campaignId?: string;
}

export async function POST(req: NextRequest) {
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { leadId, to, subject, body, campaignId } = payload;
  if (!leadId || !to || !subject || !body) {
    return NextResponse.json(
      { error: 'leadId, to, subject and body are required' },
      { status: 400 },
    );
  }

  // Basic email format guard.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 });
  }

  let mailer: ReturnType<typeof getMailer>;
  try {
    mailer = getMailer();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  let sentOk = false;
  let errorMessage: string | null = null;
  try {
    await mailer.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text: body,
    });
    sentOk = true;
  } catch (err) {
    errorMessage = (err as Error).message;
  }

  // Best-effort logging to Supabase. We don't fail the request if logging fails.
  const supabase = getServerSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('email_events').insert({
        lead_id: leadId,
        campaign_id: campaignId ?? null,
        subject,
        body,
        event_type: sentOk ? 'sent' : 'failed',
      });
      if (sentOk) {
        await supabase
          .from('coffee_leads')
          .update({ email_status: 'sent' })
          .eq('id', leadId);
      }
    } catch {
      /* ignore logging errors */
    }
  }

  if (!sentOk) {
    return NextResponse.json({ error: errorMessage ?? 'Send failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
