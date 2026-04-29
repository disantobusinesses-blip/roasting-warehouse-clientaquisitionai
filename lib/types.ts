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
