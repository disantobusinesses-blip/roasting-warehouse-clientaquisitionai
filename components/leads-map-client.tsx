'use client';

import dynamic from 'next/dynamic';

/**
 * react-leaflet is not SSR-safe. Wrap LeadsMap in a client-only dynamic import
 * so it never gets rendered during server-side build/render.
 */
const LeadsMap = dynamic(() => import('./leads-map'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center text-zinc-500 text-sm"
      style={{ height: 'calc(100vh - 8rem)', background: '#0A0A0A' }}
    >
      Loading map…
    </div>
  ),
});

export default function LeadsMapClient(props: { onDraftOutreach?: (leadId: string) => void }) {
  return <LeadsMap {...props} />;
}
