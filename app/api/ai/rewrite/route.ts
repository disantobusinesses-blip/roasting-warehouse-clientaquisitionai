import { NextRequest, NextResponse } from 'next/server';
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
  email: string;
  instruction: string;
  tone?: string;
  lead?: LeadContext;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.email || !body?.instruction) {
    return NextResponse.json(
      { error: 'Both `email` and `instruction` are required' },
      { status: 400 },
    );
  }

  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const leadInfo = body.lead ? `\nLead details:\n${describeLead(body.lead)}` : '';
  const tone = body.tone ? ` Tone: ${body.tone}.` : '';

  const userMessage =
    `Rewrite the following cold outreach email per this instruction: ` +
    `"${body.instruction}".${tone}${leadInfo}\n\nORIGINAL EMAIL:\n${body.email}\n\n` +
    `Return only the rewritten email body. No commentary, no subject line.`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: SYSTEM_PROMPT_EMAIL,
      messages: [{ role: 'user', content: userMessage }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n')
      .trim();
    return NextResponse.json({ email: text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
