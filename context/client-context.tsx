'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  acquisitionStage: 'initial-contact' | 'discovery' | 'proposal' | 'negotiation' | 'closed';
  value: number;
  notes: string;
  createdAt: string;
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
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Fetch from coffee_customers table
      const { data: customers, error: customersError } = await supabase
        .from('coffee_customers')
        .select('*');

      if (customersError) throw customersError;

      // Fetch from coffee_leads table
      const { data: leads, error: leadsError } = await supabase
        .from('coffee_leads')
        .select('*');

      if (leadsError) throw leadsError;

      // Transform customers
      const transformedCustomers: Client[] = (customers || []).map(c => ({
        id: c.id?.toString() || '',
        name: c.contact_name || '',
        email: c.contact_email || '',
        phone: c.contact_phone || '',
        company: c.business_name || '',
        status: 'customer' as const,
        acquisitionStage: 'closed' as const,
        value: c.monthly_order_value || 0,
        notes: c.notes || '',
        createdAt: c.created_at || new Date().toISOString(),
      }));

      // Transform leads
      const transformedLeads: Client[] = (leads || []).map(l => ({
        id: l.id?.toString() || '',
        name: l.contact_name || '',
        email: l.contact_email || '',
        phone: l.contact_phone || '',
        company: l.business_name || '',
        status: (l.lead_status || 'lead') as 'lead' | 'prospect' | 'customer' | 'inactive',
        acquisitionStage: (l.pipeline_stage || 'initial-contact') as any,
        value: l.estimated_value || 0,
        notes: l.notes || '',
        createdAt: l.created_at || new Date().toISOString(),
      }));

      setClients([...transformedCustomers, ...transformedLeads]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Client) => {
    try {
      const isCustomer = client.status === 'customer';
      const table = isCustomer ? 'coffee_customers' : 'coffee_leads';
      
      const { error } = await supabase
        .from(table)
        .insert([{
          contact_name: client.name,
          contact_email: client.email,
          contact_phone: client.phone,
          business_name: client.company,
          notes: client.notes,
          monthly_order_value: client.value,
          ...(isCustomer ? {} : {
            lead_status: client.status,
            pipeline_stage: client.acquisitionStage,
            estimated_value: client.value,
          })
        }]);

      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const client = clients.find(c => c.id === id);
      if (!client) return;

      const isCustomer = client.status === 'customer';
      const table = isCustomer ? 'coffee_customers' : 'coffee_leads';

      const { error } = await supabase
        .from(table)
        .update({
          contact_name: updates.name || client.name,
          contact_email: updates.email || client.email,
          contact_phone: updates.phone || client.phone,
          business_name: updates.company || client.company,
          notes: updates.notes || client.notes,
          monthly_order_value: updates.value || client.value,
          ...(isCustomer ? {} : {
            lead_status: updates.status || client.status,
            pipeline_stage: updates.acquisitionStage || client.acquisitionStage,
            estimated_value: updates.value || client.value,
          })
        })
        .eq('id', id);

      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const client = clients.find(c => c.id === id);
      if (!client) return;

      const isCustomer = client.status === 'customer';
      const table = isCustomer ? 'coffee_customers' : 'coffee_leads';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
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
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
}
