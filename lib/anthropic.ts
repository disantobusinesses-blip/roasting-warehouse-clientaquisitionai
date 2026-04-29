import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const CLAUDE_MAX_TOKENS = 1000;

export const SYSTEM_PROMPT_EMAIL =
  'You are an expert B2B sales copywriter for Roasting Warehouse, a premium ' +
  'Melbourne specialty coffee wholesaler. Write a highly personalised cold ' +
  'outreach email to this café. Use their name, suburb, and Google rating ' +
  'naturally. Be warm but confident. Keep it under 150 words. No generic openers.';

export interface LeadContext {
  business_name?: string | null;
  suburb?: string | null;
  state?: string | null;
  google_rating?: number | null;
  contact_name?: string | null;
  pipeline_stage?: string | null;
  lead_status?: string | null;
  email_status?: string | null;
  notes?: string | null;
}

export function describeLead(lead: LeadContext): string {
  const parts: string[] = [];
  if (lead.business_name) parts.push(`Business: ${lead.business_name}`);
  if (lead.contact_name) parts.push(`Contact: ${lead.contact_name}`);
  if (lead.suburb || lead.state)
    parts.push(`Location: ${[lead.suburb, lead.state].filter(Boolean).join(', ')}`);
  if (lead.google_rating != null) parts.push(`Google rating: ${lead.google_rating}`);
  if (lead.pipeline_stage) parts.push(`Pipeline stage: ${lead.pipeline_stage}`);
  if (lead.lead_status) parts.push(`Lead status: ${lead.lead_status}`);
  if (lead.email_status) parts.push(`Email status: ${lead.email_status}`);
  if (lead.notes) parts.push(`Notes: ${lead.notes}`);
  return parts.join('\n');
}
