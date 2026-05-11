'use client';

import { useLeads } from '@/context/leads-context';
import type { CoffeeLead } from '@/lib/types';

interface UseCoffeeLeadsResult {
  leads: CoffeeLead[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  setLeadEmailSent: (id: string) => void;
}

/**
 * Backwards-compatible thin wrapper around the shared LeadsProvider.
 * Existing screens (AI Outreach Centre) keep their original API while the new
 * CRM screens use `useLeads()` directly.
 */
export function useCoffeeLeads(): UseCoffeeLeadsResult {
  const { leads, loading, error, reload, setLeadEmailSent } = useLeads();
  return { leads, loading, error, reload, setLeadEmailSent };
}
