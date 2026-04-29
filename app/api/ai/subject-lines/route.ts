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
  lead?: LeadContext;
  email?: string;
  tone?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let client: ReturnType<typeof getAnthropicClient>;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const leadInfo = body.lead ? `Lead details:\n${describeLead(body.lead)}\n` : '';
  const emailInfo = body.email ? `\nDraft email:\n${body.email}\n` : '';
  const tone = body.tone ? `Tone: ${body.tone}.\n` : '';
  const prompt =
    `${tone}${leadInfo}${emailInfo}\nGenerate exactly 5 short, high-converting cold ` +
    `outreach email subject lines for a Melbourne specialty coffee wholesaler ` +
    `contacting this café. Each under 60 characters. Return strict JSON: ` +
    `{"subjects": ["...", "...", "...", "...", "..."]}. No commentary.`;

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
    let subjects: string[] = [];
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { subjects?: unknown };
        if (Array.isArray(parsed.subjects)) {
          subjects = parsed.subjects.filter((s): s is string => typeof s === 'string');
        }
      } catch {
        /* fallthrough */
      }
    }
    if (subjects.length === 0) {
      // Fallback: split lines
      subjects = text
        .split('\n')
        .map((l) => l.replace(/^[\s\-*\d.\"']+/, '').replace(/[\"']\s*,?\s*$/, '').trim())
        .filter(Boolean)
        .slice(0, 5);
    }
    return NextResponse.json({ subjects: subjects.slice(0, 5) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
