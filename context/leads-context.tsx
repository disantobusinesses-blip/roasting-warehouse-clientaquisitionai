'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type {
  CoffeeLead,
  ContactActivity,
  ContactStage,
} from '@/lib/types';

const LEAD_COLS =
  'id, business_name, contact_name, contact_email, contact_phone, suburb, state, google_rating, google_maps_url, website, lead_status, pipeline_stage, estimated_value, email_status, latitude, longitude, notes, contact_stage, contact_attempts, last_contacted_at, contact_notes, is_existing_client, became_client_at';

const ACTIVITY_COLS =
  'id, lead_id, stage, attempt_number, channel, outcome, notes, contacted_by, created_at';

interface LogContactInput {
  leadId: string;
  stage: ContactStage;
  channel?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

interface LeadsContextValue {
  leads: CoffeeLead[];
  loading: boolean;
  error: string | null;
  reload: () => void;

  /** Generic optimistic update for arbitrary lead columns. */
  updateLead: (id: string, patch: Partial<CoffeeLead>) => Promise<void>;

  /** Change stage + bump attempts + write activity row. */
  setLeadStage: (leadId: string, stage: ContactStage) => Promise<void>;

  /** Set contact_attempts directly (no activity row). */
  setAttempts: (leadId: string, attempts: number) => Promise<void>;

  /** Persist contact_notes. */
  saveNotes: (leadId: string, notes: string) => Promise<void>;

  /** Compact "Log Contact" flow — writes lead + activity row. */
  logContact: (input: LogContactInput) => Promise<void>;

  /** Mark lead as an existing client: sets flag + timestamp + stage = acquired. */
  markAsClient: (leadId: string) => Promise<void>;

  /** Mark email_status = 'sent' optimistically (used by outreach screen). */
  setLeadEmailSent: (id: string) => void;

  /** Recent 10 activity events across all leads. */
  recentActivity: ContactActivity[];
  recentActivityLoading: boolean;
  reloadActivity: () => void;

  /** Per-lead activity feed. */
  getActivity: (leadId: string) => Promise<ContactActivity[]>;
}

const LeadsContext = createContext<LeadsContextValue | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<CoffeeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [recentActivity, setRecentActivity] = useState<ContactActivity[]>([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [activityReloadKey, setActivityReloadKey] = useState(0);

  /* ──────────────────────────── Initial fetch: leads ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from('coffee_leads')
      .select(LEAD_COLS)
      .order('business_name', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setLeads([]);
        } else {
          setLeads((data ?? []) as CoffeeLead[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /* ─────────────────────────── Recent activity fetch ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setRecentActivity([]);
      setRecentActivityLoading(false);
      return;
    }
    setRecentActivityLoading(true);
    supabase
      .from('contact_activity')
      .select(ACTIVITY_COLS)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setRecentActivity([]);
        } else {
          setRecentActivity((data ?? []) as ContactActivity[]);
        }
        setRecentActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activityReloadKey]);

  /* ───────────────────────────────── Helpers ─────────────────────────────── */
  const applyLocal = useCallback(
    (id: string, patch: Partial<CoffeeLead>) => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [],
  );

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const reloadActivity = useCallback(
    () => setActivityReloadKey((k) => k + 1),
    [],
  );

  const updateLead = useCallback(
    async (id: string, patch: Partial<CoffeeLead>) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const prev = leads.find((l) => l.id === id);
      applyLocal(id, patch);
      const { error: err } = await supabase
        .from('coffee_leads')
        .update(patch)
        .eq('id', id);
      if (err && prev) {
        applyLocal(id, prev);
        setError(err.message);
      }
    },
    [leads, applyLocal],
  );

  const setLeadStage = useCallback(
    async (leadId: string, stage: ContactStage) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      const isReset = stage === 'not_contacted';
      const newAttempts = isReset ? 0 : (lead.contact_attempts ?? 0) + 1;
      const now = new Date().toISOString();
      const newLastContact = isReset ? lead.last_contacted_at : now;

      // Optimistic update
      applyLocal(leadId, {
        contact_stage: stage,
        contact_attempts: newAttempts,
        last_contacted_at: newLastContact,
      });

      const updates: Partial<CoffeeLead> = {
        contact_stage: stage,
        contact_attempts: newAttempts,
      };
      if (!isReset) updates.last_contacted_at = now;

      const { error: err } = await supabase
        .from('coffee_leads')
        .update(updates)
        .eq('id', leadId);
      if (err) {
        setError(err.message);
        return;
      }

      await supabase.from('contact_activity').insert({
        lead_id: leadId,
        stage,
        attempt_number: newAttempts,
      });
      reloadActivity();
    },
    [leads, applyLocal, reloadActivity],
  );

  const setAttempts = useCallback(
    async (leadId: string, attempts: number) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const safe = Math.max(0, Math.floor(attempts));
      applyLocal(leadId, { contact_attempts: safe });
      const { error: err } = await supabase
        .from('coffee_leads')
        .update({ contact_attempts: safe })
        .eq('id', leadId);
      if (err) setError(err.message);
    },
    [applyLocal],
  );

  const saveNotes = useCallback(
    async (leadId: string, notes: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      applyLocal(leadId, { contact_notes: notes });
      const { error: err } = await supabase
        .from('coffee_leads')
        .update({ contact_notes: notes })
        .eq('id', leadId);
      if (err) setError(err.message);
    },
    [applyLocal],
  );

  const logContact = useCallback(
    async (input: LogContactInput) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const lead = leads.find((l) => l.id === input.leadId);
      if (!lead) return;

      const now = new Date().toISOString();
      const newAttempts = (lead.contact_attempts ?? 0) + 1;

      // Append the new note to existing notes with a timestamp prefix.
      const stamp = new Date().toLocaleString();
      const appended = input.notes?.trim()
        ? lead.contact_notes?.trim()
          ? `${lead.contact_notes}\n\n[${stamp}] ${input.notes.trim()}`
          : `[${stamp}] ${input.notes.trim()}`
        : lead.contact_notes;

      applyLocal(input.leadId, {
        contact_stage: input.stage,
        contact_attempts: newAttempts,
        last_contacted_at: now,
        contact_notes: appended ?? null,
      });

      const { error: updErr } = await supabase
        .from('coffee_leads')
        .update({
          contact_stage: input.stage,
          contact_attempts: newAttempts,
          last_contacted_at: now,
          contact_notes: appended ?? null,
        })
        .eq('id', input.leadId);
      if (updErr) {
        setError(updErr.message);
        return;
      }

      await supabase.from('contact_activity').insert({
        lead_id: input.leadId,
        stage: input.stage,
        attempt_number: newAttempts,
        channel: input.channel ?? null,
        outcome: input.outcome ?? null,
        notes: input.notes ?? null,
      });
      reloadActivity();
    },
    [leads, applyLocal, reloadActivity],
  );

  const setLeadEmailSent = useCallback(
    (id: string) => applyLocal(id, { email_status: 'sent' }),
    [applyLocal],
  );

  const markAsClient = useCallback(
    async (leadId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      const now = new Date().toISOString();
      const becameAt = lead.became_client_at ?? now;
      const newAttempts = (lead.contact_attempts ?? 0) + 1;

      // Optimistic
      applyLocal(leadId, {
        is_existing_client: true,
        became_client_at: becameAt,
        contact_stage: 'acquired',
        contact_attempts: newAttempts,
        last_contacted_at: now,
      });

      const { error: updErr } = await supabase
        .from('coffee_leads')
        .update({
          is_existing_client: true,
          became_client_at: becameAt,
          contact_stage: 'acquired',
          contact_attempts: newAttempts,
          last_contacted_at: now,
        })
        .eq('id', leadId);
      if (updErr) {
        setError(updErr.message);
        return;
      }

      await supabase.from('contact_activity').insert({
        lead_id: leadId,
        stage: 'acquired',
        attempt_number: newAttempts,
        channel: null,
        outcome: 'marked_as_client',
        notes: 'Marked as existing client',
      });
      reloadActivity();
    },
    [leads, applyLocal, reloadActivity],
  );

  const getActivity = useCallback(
    async (leadId: string): Promise<ContactActivity[]> => {
      const supabase = getSupabaseClient();
      if (!supabase) return [];
      const { data, error: err } = await supabase
        .from('contact_activity')
        .select(ACTIVITY_COLS)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (err) return [];
      return (data ?? []) as ContactActivity[];
    },
    [],
  );

  const value = useMemo<LeadsContextValue>(
    () => ({
      leads,
      loading,
      error,
      reload,
      updateLead,
      setLeadStage,
      setAttempts,
      saveNotes,
      logContact,
      markAsClient,
      setLeadEmailSent,
      recentActivity,
      recentActivityLoading,
      reloadActivity,
      getActivity,
    }),
    [
      leads,
      loading,
      error,
      reload,
      updateLead,
      setLeadStage,
      setAttempts,
      saveNotes,
      logContact,
      markAsClient,
      setLeadEmailSent,
      recentActivity,
      recentActivityLoading,
      reloadActivity,
      getActivity,
    ],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error('useLeads must be used inside <LeadsProvider>');
  }
  return ctx;
}
