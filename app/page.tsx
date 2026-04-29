'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Dashboard from '@/components/dashboard';
import LeadsTable from '@/components/leads-table';
import LeadDetailDrawer from '@/components/lead-detail-drawer';
import EmailCentre from '@/components/email-centre';
import { ClientProvider } from '@/context/client-context';

type View = 'dashboard' | 'leads' | 'email-centre';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedLeadId(null);
  };

  return (
    <ClientProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar currentView={view} onViewChange={setView} />
        
        {/* Main content area */}
        <main className="lg:ml-64 min-h-screen">
          {/* Mobile spacer for fixed header */}
          <div className="h-14 lg:hidden" />
          
          <div className="p-6 lg:p-8">
            {view === 'dashboard' && (
              <Dashboard onNavigateToLeads={() => setView('leads')} />
            )}
            {view === 'leads' && (
              <LeadsTable onSelectLead={handleSelectLead} />
            )}
            {view === 'email-centre' && (
              <EmailCentre />
            )}
          </div>
        </main>

        {/* Lead Detail Drawer */}
        <LeadDetailDrawer
          leadId={selectedLeadId}
          open={drawerOpen}
          onClose={handleCloseDrawer}
        />
      </div>
    </ClientProvider>
  );
}
