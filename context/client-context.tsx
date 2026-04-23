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
  leadTemperature: 'cold' | 'warm' | 'responded';
  aiAcquired: boolean;
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
