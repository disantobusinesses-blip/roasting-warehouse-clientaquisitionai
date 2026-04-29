'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: 'lead' | 'prospect' | 'customer' | 'inactive';
    acquisitionStage: 'initial-contact' | 'discovery' | 'proposal' | 'negotiation' | 'closed';
    leadTemperature: 'cold' | 'warm' | 'responded';
    aiAcquired: boolean;
    value: number;
    notes: string;
    createdAt: string;
}

// Maps a coffee_leads DB row (snake_case) to the Client interface (camelCase)
function mapRowToClient(row: Record<string, unknown>): Client {
    const emailStatus = (row.email_status as string) || '';
    let leadTemperature: Client['leadTemperature'] = 'cold';
    if (emailStatus === 'replied') leadTemperature = 'responded';
    else if (emailStatus === 'opened' || emailStatus === 'clicked') leadTemperature = 'warm';

  const validStatuses = ['lead', 'prospect', 'customer', 'inactive'];
    const rawStatus = (row.lead_status as string) || 'lead';
    const status: Client['status'] = validStatuses.includes(rawStatus)
      ? (rawStatus as Client['status'])
          : 'lead';

  const validStages = ['initial-contact', 'discovery', 'proposal', 'negotiation', 'closed'];
    const rawStage = (row.pipeline_stage as string) || 'initial-contact';
    const acquisitionStage: Client['acquisitionStage'] = validStages.includes(rawStage)
      ? (rawStage as Client['acquisitionStage'])
          : 'initial-contact';

  return {
        id: row.id as string,
        name: (row.contact_name as string) || (row.business_name as string) || '',
        email: (row.contact_email as string) || '',
        phone: (row.contact_phone as string) || '',
        company: (row.business_name as string) || '',
        status,
        acquisitionStage,
        leadTemperature,
        aiAcquired: false,
        value: Number(row.estimated_value) || 0,
        notes: (row.notes as string) || '',
        createdAt: row.created_at
          ? (row.created_at as string).split('T')[0]
                : new Date().toISOString().split('T')[0],
};
}

interface ClientContextType {
    clients: Client[];
    loading: boolean;
    addClient: (client: Client) => void;
    updateClient: (id: string, client: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    getClientById: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

  useEffect(() => {
        const fetchClients = async () => {
                const supabase = getSupabaseClient();
                if (!supabase) {
                          console.error('[ClientProvider] Supabase client unavailable - check env vars');
                          setLoading(false);
                          return;
                }
                const { data, error } = await supabase
                  .from('coffee_leads')
                  .select('*')
                  .order('created_at', { ascending: false });

                if (error) {
                          console.error('[ClientProvider] Error fetching leads:', error);
                } else if (data) {
                          setClients(data.map(mapRowToClient));
                }
                setLoading(false);
        };
        fetchClients();
  }, []);

  const addClient = (client: Client) => {
        setClients([...clients, client]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
        setClients(clients.map(client =>
                client.id === id ? { ...client, ...updates } : client
                                   ));
  };

  const deleteClient = (id: string) => {
        setClients(clients.filter(client => client.id !== id));
  };

  const getClientById = (id: string) => {
        return clients.find(client => client.id === id);
  };

  return (
        <ClientContext.Provider value={{ clients, loading, addClient, updateClient, deleteClient, getClientById }}>
          {children}
        </ClientContext.Provider>
      );
}

export function useClients() {
    const context = useContext(ClientContext);
    if (!context) {
          throw new Error('useClients must be used within a ClientProvider');
    }
    return context;
}
