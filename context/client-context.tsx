'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@coffeeco.com',
    phone: '555-0101',
    company: 'Coffee Co',
    status: 'customer',
    acquisitionStage: 'closed',
    value: 50000,
    notes: 'Long-term contract, monthly delivery',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@cafebistro.com',
    phone: '555-0102',
    company: 'Cafe Bistro',
    status: 'prospect',
    acquisitionStage: 'proposal',
    value: 25000,
    notes: 'Interested in bulk purchasing, awaiting decision',
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike@roastersunited.com',
    phone: '555-0103',
    company: 'Roasters United',
    status: 'lead',
    acquisitionStage: 'discovery',
    value: 15000,
    notes: 'Initial contact, scheduled demo next week',
    createdAt: '2024-03-10'
  }
];

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [loading] = useState(false);

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
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
}
