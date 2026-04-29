import { NextRequest, NextResponse } from 'next/server';
import {
  getAnthropicClient,
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
} from '@/lib/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  email: string;
  subject?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body?.email) {
    return NextResponse.json({ error: '`email` is required' }, { status: 400 });
  }

  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const subject = body.subject ? `Subject: ${body.subject}\n\n` : '';
  const prompt =
    `You are a senior B2B sales coach. Score the effectiveness of this cold ` +
    `outreach email for a Melbourne café from 0-100. Consider personalisation, ` +
    `clarity, hook strength, brevity, call-to-action, and tone. ` +
    `Reply with strict JSON only: {"score": <int 0-100>, "summary": "<one short sentence>", ` +
    `"strengths": ["..."], "improvements": ["..."]}.\n\n${subject}EMAIL:\n${body.email}`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n')
      .trim();

    // Try to extract JSON from the response.
    const match = text.match(/\{[\s\S]*\}/);
    let parsed: { score?: number; summary?: string; strengths?: string[]; improvements?: string[] } = {};
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        /* fallthrough */
      }
    }

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    return NextResponse.json({
      score,
      summary: parsed.summary ?? '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
