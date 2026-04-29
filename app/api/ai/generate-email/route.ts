import { NextRequest } from 'next/server';
import {
  getAnthropicClient,
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
  SYSTEM_PROMPT_EMAIL,
  describeLead,
  LeadContext,
} from '@/lib/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  lead: LeadContext;
  tone?: string;
  extraInstruction?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const lead = body?.lead;
  if (!lead || typeof lead !== 'object') {
    return new Response('Missing lead data', { status: 400 });
  }

  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }

  const tone = body.tone ? `Tone: ${body.tone}.` : '';
  const extra = body.extraInstruction ? `\nAdditional guidance: ${body.extraInstruction}` : '';
  const userMessage =
    `${tone}\nLead details:\n${describeLead(lead)}${extra}\n\n` +
    `Write the email body only. Do not include subject lines, headers, or commentary.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          system: SYSTEM_PROMPT_EMAIL,
          messages: [{ role: 'user', content: userMessage }],
        });

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n[error: ${(err as Error).message}]`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
