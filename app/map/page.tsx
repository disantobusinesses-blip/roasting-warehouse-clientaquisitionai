'use client';

import LeadsMapClient from '@/components/leads-map-client';

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 lg:ml-64">
      <LeadsMapClient />
    </div>
  );
}
