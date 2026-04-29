'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { CoffeeLead } from '@/lib/types';

interface UseCoffeeLeadsResult {
  leads: CoffeeLead[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  setLeadEmailSent: (id: string) => void;
}

/**
 * Loads coffee_leads rows from Supabase. If the client cannot be created
 * (missing env vars), returns an empty list with a friendly message.
 */
export function useCoffeeLeads(): UseCoffeeLeadsResult {
  const [leads, setLeads] = useState<CoffeeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from('coffee_leads')
      .select(
        'id, business_name, contact_name, contact_email, contact_phone, suburb, state, google_rating, google_maps_url, website, lead_status, pipeline_stage, estimated_value, email_status, latitude, longitude, notes',
      )
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

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const setLeadEmailSent = useCallback((id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, email_status: 'sent' } : l)),
    );
  }, []);

  return { leads, loading, error, reload, setLeadEmailSent };
}
