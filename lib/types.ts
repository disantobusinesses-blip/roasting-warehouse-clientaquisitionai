export type LeadStatus =
  | 'cold'
  | 'warm'
  | 'hot'
  | 'responded'
  | 'converted'
  | 'not_interested';

export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type EmailStatus = 'not_sent' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';

/**
 * 9-stage B2B sales pipeline used by the new CRM.
 */
export type ContactStage =
  | 'not_contacted'
  | 'contacted'
  | 'responded'
  | 'tasting_booked'
  | 'proposal_sent'
  | 'negotiating'
  | 'onboarded'
  | 'acquired'
  | 'lost';

export type ContactChannel =
  | 'phone'
  | 'email'
  | 'in_person'
  | 'instagram'
  | 'other';

export type ContactOutcome =
  | 'reached'
  | 'voicemail'
  | 'no_answer'
  | 'interested'
  | 'not_interested';

export interface CoffeeLead {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  suburb: string | null;
  state: string | null;
  google_rating: number | null;
  google_maps_url: string | null;
  website: string | null;
  lead_status: LeadStatus | null;
  pipeline_stage: PipelineStage | null;
  estimated_value: number | null;
  email_status: EmailStatus | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  /** Sales pipeline stage (new CRM). */
  contact_stage: ContactStage | null;
  /** Number of contact attempts made. */
  contact_attempts: number | null;
  /** ISO timestamp of last contact event. */
  last_contacted_at: string | null;
  /** Free-form sales notes (separate from generic `notes`). */
  contact_notes: string | null;
}

export interface ContactActivity {
  id: string;
  lead_id: string;
  stage: ContactStage | null;
  attempt_number: number | null;
  channel: string | null;
  outcome: string | null;
  notes: string | null;
  contacted_by: string | null;
  created_at: string;
}

export interface OutreachCampaign {
  id?: string;
  name: string;
  status: 'draft' | 'sending' | 'sent';
  total_sent: number;
  open_rate?: number | null;
  created_at?: string;
}

export interface EmailEvent {
  id?: string;
  lead_id: string;
  campaign_id?: string | null;
  subject: string;
  body: string;
  event_type: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  created_at?: string;
}

export type Tone = 'Professional' | 'Casual' | 'Aggressive' | 'Friendly' | 'Urgent';

/* ────────────────────────────────────────────────────────────────────────── */
/* Display helpers for the 9 contact stages                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export const CONTACT_STAGES: ContactStage[] = [
  'not_contacted',
  'contacted',
  'responded',
  'tasting_booked',
  'proposal_sent',
  'negotiating',
  'onboarded',
  'acquired',
  'lost',
];

export const CONTACT_STAGE_LABEL: Record<ContactStage, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  responded: 'Responded',
  tasting_booked: 'Tasting Booked',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  onboarded: 'Onboarded',
  acquired: 'Acquired',
  lost: 'Lost',
};

/**
 * Tailwind classes for the colour-coded stage pill.
 */
export const CONTACT_STAGE_PILL: Record<ContactStage, string> = {
  not_contacted: 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/40',
  contacted: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  responded: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  tasting_booked: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  proposal_sent: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
  negotiating: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  onboarded: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
  acquired: 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40',
  lost: 'bg-red-900/30 text-red-400/80 border border-red-800/40',
};
