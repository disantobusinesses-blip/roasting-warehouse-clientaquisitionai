'use client';

import { useState } from 'react';
import Navbar from '@/components/navbar';
import Dashboard from '@/components/dashboard';
import ClientsList from '@/components/clients-list';
import ClientDetail from '@/components/client-detail';
import { ClientProvider } from '@/context/client-context';

type View = 'dashboard' | 'clients' | 'client-detail';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setView('client-detail');
  };

  const handleBack = () => {
    setView('clients');
    setSelectedClientId(null);
  };

  return (
    <ClientProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar currentView={view} onViewChange={setView} />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {view === 'dashboard' && <Dashboard onNavigateToClients={() => setView('clients')} />}
          {view === 'clients' && <ClientsList onSelectClient={handleSelectClient} />}
          {view === 'client-detail' && selectedClientId && (
            <ClientDetail clientId={selectedClientId} onBack={handleBack} />
          )}
        </main>
      </div>
    </ClientProvider>
  );
}
