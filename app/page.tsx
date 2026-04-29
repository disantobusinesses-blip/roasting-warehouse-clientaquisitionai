'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Dashboard from '@/components/dashboard';
import LeadsTable from '@/components/leads-table';
import LeadDetailDrawer from '@/components/lead-detail-drawer';
import AIOutreachCentre from '@/components/ai-outreach-centre';
import LeadsMapClient from '@/components/leads-map-client';
import { ClientProvider } from '@/context/client-context';

type View = 'dashboard' | 'leads' | 'email-centre' | 'map';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [outreachPreselectId, setOutreachPreselectId] = useState<string | null>(null);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedLeadId(null);
  };

  const handleDraftOutreachFromMap = (leadId: string) => {
    setOutreachPreselectId(leadId);
    setView('email-centre');
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
              <AIOutreachCentre
                preselectLeadId={outreachPreselectId}
                onPreselectHandled={() => setOutreachPreselectId(null)}
              />
            )}
            {view === 'map' && (
              <LeadsMapClient onDraftOutreach={handleDraftOutreachFromMap} />
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
