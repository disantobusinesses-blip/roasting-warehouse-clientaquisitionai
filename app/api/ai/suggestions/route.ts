import { NextRequest, NextResponse } from 'next/server';
import {
  getAnthropicClient,
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
  describeLead,
  LeadContext,
} from '@/lib/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  lead: LeadContext;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body?.lead) {
    return NextResponse.json({ error: '`lead` is required' }, { status: 400 });
  }

  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const prompt =
    `You advise a Melbourne specialty coffee wholesaler doing cold outreach. ` +
    `Given the following café lead, give exactly 3 short, sharp, contextual ` +
    `outreach tips. Each tip 1 sentence, max 18 words, actionable. Mention specific ` +
    `details from the lead (suburb, rating, status) where relevant. ` +
    `Return strict JSON: {"tips": ["...", "...", "..."]}. No commentary.\n\n` +
    `Lead details:\n${describeLead(body.lead)}`;

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

    const match = text.match(/\{[\s\S]*\}/);
    let tips: string[] = [];
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { tips?: unknown };
        if (Array.isArray(parsed.tips)) {
          tips = parsed.tips.filter((t): t is string => typeof t === 'string');
        }
      } catch {
        /* fallthrough */
      }
    }
    if (tips.length === 0) {
      tips = text
        .split('\n')
        .map((l) => l.replace(/^[\s\-*\d.\"']+/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return NextResponse.json({ tips: tips.slice(0, 3) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
