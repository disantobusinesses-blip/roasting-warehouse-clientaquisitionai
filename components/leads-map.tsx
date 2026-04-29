'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Sparkles,
  Pencil,
  X,
} from 'lucide-react';
import { useCoffeeLeads } from '@/hooks/use-coffee-leads';
import type { CoffeeLead, LeadStatus } from '@/lib/types';

const GOLD = '#C9A84C';

const STATUS_COLOURS: Record<LeadStatus, string> = {
  cold: '#6B7280',
  warm: '#F59E0B',
  hot: '#EF4444',
  responded: '#3B82F6',
  converted: GOLD,
  not_interested: '#3f3f46',
};

const FILTER_OPTIONS: Array<{ key: 'all' | LeadStatus; label: string; dot: string }> = [
  { key: 'all', label: 'All', dot: '#ffffff' },
  { key: 'hot', label: 'Hot', dot: STATUS_COLOURS.hot },
  { key: 'warm', label: 'Warm', dot: STATUS_COLOURS.warm },
  { key: 'cold', label: 'Cold', dot: STATUS_COLOURS.cold },
  { key: 'converted', label: 'Converted', dot: STATUS_COLOURS.converted },
];

function makeMarkerIcon(status: LeadStatus | null): L.DivIcon {
  const s: LeadStatus = (status ?? 'cold') as LeadStatus;
  const colour = STATUS_COLOURS[s] ?? STATUS_COLOURS.cold;
  const isConverted = s === 'converted';
  const isHot = s === 'hot';
  const size = isConverted ? 22 : s === 'not_interested' ? 12 : 16;

  const innerHtml = isConverted
    ? `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="${colour}" stroke="#000" stroke-width="1" d="M12 2l2.9 6.6 7.1.7-5.3 4.9 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.3l7.1-.7L12 2z"/>
       </svg>`
    : `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${colour};box-shadow:0 0 0 2px #0A0A0A,0 0 6px ${colour}66;"></span>`;

  const pulse = isHot
    ? `<span class="rw-pulse" style="position:absolute;inset:0;border-radius:50%;border:2px solid ${colour};opacity:.7;"></span>`
    : '';

  return L.divIcon({
    className: 'rw-marker',
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">${pulse}${innerHtml}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIconCreate(cluster: { getChildCount(): number }): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: 'rw-cluster',
    html: `<div style="background:${GOLD};color:#0A0A0A;font-weight:700;font-size:13px;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(201,168,76,0.18),0 4px 12px rgba(0,0,0,0.5);border:2px solid #0A0A0A;">${count}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

interface LeadsMapProps {
  onDraftOutreach?: (leadId: string) => void;
}

export default function LeadsMap({ onDraftOutreach }: LeadsMapProps) {
  const { leads, loading, error } = useCoffeeLeads();
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [selected, setSelected] = useState<CoffeeLead | null>(null);

  const visibleLeads = useMemo(() => {
    const withCoords = leads.filter(
      (l) => typeof l.latitude === 'number' && typeof l.longitude === 'number',
    );
    if (filter === 'all') return withCoords;
    return withCoords.filter((l) => (l.lead_status ?? 'cold') === filter);
  }, [leads, filter]);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 8rem)' }}>
      <style>{`
        .rw-pulse { animation: rw-pulse 1.6s ease-out infinite; }
        @keyframes rw-pulse {
          0% { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container { background: #0A0A0A !important; }
        .leaflet-control-attribution { background: rgba(10,10,10,0.7) !important; color: #555 !important; font-size: 10px; }
        .leaflet-control-attribution a { color: #888 !important; }
      `}</style>

      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={5}
        style={{ width: '100%', height: '100%', background: '#0A0A0A' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <FitToBounds leads={visibleLeads} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={clusterIconCreate}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          maxClusterRadius={45}
        >
          {visibleLeads.map((l) => (
            <Marker
              key={l.id}
              position={[l.latitude as number, l.longitude as number]}
              icon={makeMarkerIcon(l.lead_status)}
              eventHandlers={{ click: () => setSelected(l) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0A0A0A]/90 border border-[#1f1f1f] backdrop-blur shadow-lg">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
                style={active ? { background: 'rgba(201,168,76,0.15)', boxShadow: `inset 0 0 0 1px ${GOLD}` } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: opt.dot, boxShadow: `0 0 4px ${opt.dot}` }}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-[#0A0A0A]/90 border border-[#1f1f1f] text-xs text-zinc-300 backdrop-blur shadow-lg w-fit">
          {loading ? (
            <span className="text-zinc-500">Loading leads…</span>
          ) : (
            <>
              <span className="font-semibold" style={{ color: GOLD }}>
                {visibleLeads.length}
              </span>{' '}
              leads shown
            </>
          )}
        </div>
        {error && (
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 backdrop-blur shadow-lg max-w-xs">
            {error}
          </div>
        )}
      </div>

      {/* Right slide-in detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            key={selected.id}
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="absolute top-4 right-4 bottom-4 w-[320px] z-[600] rounded-xl border border-[#1f1f1f] bg-[#0A0A0A]/95 backdrop-blur-md shadow-2xl flex flex-col"
          >
            <div className="flex items-start justify-between p-4 border-b border-[#1f1f1f]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <Star className="w-3.5 h-3.5" style={{ color: GOLD, fill: GOLD }} />
                  <span className="text-white">
                    {selected.google_rating != null ? selected.google_rating.toFixed(1) : '—'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
                    style={{
                      background: `${STATUS_COLOURS[(selected.lead_status ?? 'cold') as LeadStatus]}1f`,
                      color: STATUS_COLOURS[(selected.lead_status ?? 'cold') as LeadStatus],
                    }}
                  >
                    {selected.lead_status ?? 'cold'}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mt-1.5 truncate uppercase tracking-wide">
                  {selected.business_name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selected.suburb ?? '—'}
                  {selected.state ? `, ${selected.state}` : ''}
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              <DetailRow icon={<Phone className="w-3.5 h-3.5" />} value={selected.contact_phone} />
              <DetailRow
                icon={<Mail className="w-3.5 h-3.5" />}
                value={selected.contact_email}
                placeholder="(no email)"
              />
              <DetailRow
                icon={<Globe className="w-3.5 h-3.5" />}
                value={selected.website}
                href={selected.website ?? undefined}
              />
              {selected.google_maps_url && (
                <a
                  href={selected.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#C9A84C] hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" /> View on Google Maps
                </a>
              )}

              <div className="my-3 border-t border-[#1f1f1f]" />

              <div className="space-y-1.5 text-xs">
                <KV k="Pipeline" v={selected.pipeline_stage ?? 'new'} />
                <KV
                  k="Status"
                  v={selected.lead_status ?? 'cold'}
                  dot={STATUS_COLOURS[(selected.lead_status ?? 'cold') as LeadStatus]}
                />
                <KV
                  k="Est. Value"
                  v={
                    selected.estimated_value != null
                      ? `$${selected.estimated_value.toLocaleString()}`
                      : '—'
                  }
                />
                <KV k="Email" v={selected.email_status ?? 'not_sent'} />
              </div>
            </div>

            <div className="p-4 border-t border-[#1f1f1f] flex gap-2">
              <button
                onClick={() => onDraftOutreach?.(selected.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-black text-xs hover:brightness-110"
                style={{ background: GOLD }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Draft Outreach
              </button>
              <button
                disabled
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a2a2a] text-zinc-300 text-xs hover:border-[#C9A84C]/40 hover:text-white disabled:opacity-50"
                title="Inline edit coming soon"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function FitToBounds({ leads }: { leads: CoffeeLead[] }) {
  const map = useMap();
  useEffect(() => {
    if (leads.length === 0) return;
    const points: [number, number][] = leads.map((l) => [
      l.latitude as number,
      l.longitude as number,
    ]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    // We intentionally fit only on lead-set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads.length]);
  return null;
}

function DetailRow({
  icon,
  value,
  placeholder,
  href,
}: {
  icon: React.ReactNode;
  value: string | null | undefined;
  placeholder?: string;
  href?: string;
}) {
  const text = value ?? placeholder ?? '—';
  const isLink = !!href;
  return (
    <div className="flex items-center gap-2 text-zinc-300">
      <span className="text-zinc-500">{icon}</span>
      {isLink ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:text-[#C9A84C] truncate"
        >
          {text}
        </a>
      ) : (
        <span className="text-xs truncate">{text}</span>
      )}
    </div>
  );
}

function KV({ k, v, dot }: { k: string; v: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{k}</span>
      <span className="inline-flex items-center gap-1.5 text-zinc-200">
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
        {v}
      </span>
    </div>
  );
}
