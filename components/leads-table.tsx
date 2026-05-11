'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Star, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLeads } from '@/context/leads-context';
import {
  CONTACT_STAGES,
  CONTACT_STAGE_LABEL,
  CONTACT_STAGE_PILL,
  type ContactStage,
  type CoffeeLead,
} from '@/lib/types';
import LogContactModal from '@/components/log-contact-modal';
import AddLeadModal from '@/components/add-lead-modal';
import MarkAsClientModal from '@/components/mark-as-client-modal';

const GOLD = '#C9A84C';

type StageFilter = 'all' | ContactStage;
type ClientFilter = 'all' | 'leads' | 'clients';

interface LeadsTableProps {
  onSelectLead: (leadId: string) => void;
}

export default function LeadsTable({ onSelectLead }: LeadsTableProps) {
  const { leads, loading, error } = useLeads();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [logLeadId, setLogLeadId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [clientLeadId, setClientLeadId] = useState<string | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = leads.filter((l) => {
      const matchesSearch =
        !q ||
        l.business_name?.toLowerCase().includes(q) ||
        l.suburb?.toLowerCase().includes(q);
      const matchesStage =
        stageFilter === 'all' ||
        (l.contact_stage ?? 'not_contacted') === stageFilter;
      const isClient = !!l.is_existing_client;
      const matchesClient =
        clientFilter === 'all'
          ? true
          : clientFilter === 'clients'
            ? isClient
            : !isClient;
      return matchesSearch && matchesStage && matchesClient;
    });

    // When viewing "All", pin existing clients to the top.
    if (clientFilter === 'all') {
      return [...list].sort((a, b) => {
        const ac = a.is_existing_client ? 1 : 0;
        const bc = b.is_existing_client ? 1 : 0;
        if (ac !== bc) return bc - ac;
        return (a.business_name ?? '').localeCompare(b.business_name ?? '');
      });
    }
    return list;
  }, [leads, search, stageFilter, clientFilter]);

  const clientCount = useMemo(
    () => leads.filter((l) => l.is_existing_client).length,
    [leads],
  );

  // Reset keyboard cursor when filters change.
  useEffect(() => {
    setKeyboardIndex(null);
  }, [search, stageFilter, clientFilter]);

  // Keyboard navigation (J/K/Enter/Escape).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (logOpen || showAddModal || clientOpen) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setKeyboardIndex((idx) => {
          const next = idx === null ? 0 : Math.min(filtered.length - 1, idx + 1);
          return filtered.length === 0 ? null : next;
        });
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setKeyboardIndex((idx) => {
          const next = idx === null ? 0 : Math.max(0, idx - 1);
          return filtered.length === 0 ? null : next;
        });
      } else if (e.key === 'Enter') {
        if (keyboardIndex !== null && filtered[keyboardIndex]) {
          e.preventDefault();
          onSelectLead(filtered[keyboardIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, keyboardIndex, onSelectLead, logOpen, showAddModal, clientOpen]);

  // Scroll keyboard-selected row into view.
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
  useEffect(() => {
    if (keyboardIndex === null) return;
    const el = rowRefs.current[keyboardIndex];
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [keyboardIndex]);

  const handleLogContact = (leadId: string) => {
    setLogLeadId(leadId);
    setLogOpen(true);
  };

  const handleMarkAsClient = (leadId: string) => {
    setClientLeadId(leadId);
    setClientOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            B2B sales pipeline · press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono">
              J
            </kbd>{' '}
            /{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono">
              K
            </kbd>{' '}
            to navigate,{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono">
              Enter
            </kbd>{' '}
            to open
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-black transition-all hover:brightness-110"
          style={{ background: GOLD }}
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              borderColor: GOLD,
              color: GOLD,
              background: 'rgba(201,168,76,0.05)',
            }}
          >
            {loading ? '…' : `${filtered.length} Leads`}
            {filtered.length !== leads.length && !loading
              ? ` (of ${leads.length})`
              : ''}
          </span>

          {/* Client filter chips */}
          <div
            role="tablist"
            aria-label="Client filter"
            className="inline-flex items-center p-0.5 rounded-full bg-[#121212] border border-[#1f1f1f]"
          >
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'leads', label: 'Leads' },
                { key: 'clients', label: 'Clients' },
              ] as const
            ).map((opt) => {
              const active = clientFilter === opt.key;
              const showCount = opt.key === 'clients' && clientCount > 0;
              return (
                <button
                  key={opt.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setClientFilter(opt.key)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors ${
                    active
                      ? 'text-black font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={active ? { background: GOLD } : undefined}
                >
                  {opt.key === 'clients' && (
                    <Star
                      className="w-3 h-3"
                      style={{
                        color: active ? '#000' : GOLD,
                        fill: active ? '#000' : GOLD,
                      }}
                    />
                  )}
                  {opt.label}
                  {showCount && (
                    <span
                      className={`text-[10px] px-1.5 rounded-full ${
                        active ? 'bg-black/15' : 'bg-[#C9A84C]/15'
                      }`}
                    >
                      {clientCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business or suburb…"
              className="pl-9 pr-3 py-2 w-72 bg-[#121212] border border-[#1f1f1f] rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/50"
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StageFilter)}
              className="appearance-none pl-3 pr-9 py-2 bg-[#121212] border border-[#1f1f1f] rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:border-[#C9A84C]/50"
            >
              <option value="all">All Stages</option>
              {CONTACT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {CONTACT_STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 w-10 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Business Name</th>
                <th className="px-4 py-3 font-medium">Suburb</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Last Contacted</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-border">
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-secondary/60 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    {leads.length === 0
                      ? 'No leads in the database yet.'
                      : 'No leads match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((lead, i) => (
                  <LeadRow
                    key={lead.id}
                    index={i}
                    lead={lead}
                    isKeyboardActive={keyboardIndex === i}
                    onOpen={() => onSelectLead(lead.id)}
                    onLogContact={() => handleLogContact(lead.id)}
                    onMarkAsClient={() => handleMarkAsClient(lead.id)}
                    rowRef={(el) => {
                      rowRefs.current[i] = el;
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <LogContactModal
        leadId={logLeadId}
        open={logOpen}
        onClose={() => {
          setLogOpen(false);
          setLogLeadId(null);
        }}
      />
      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <MarkAsClientModal
        leadId={clientLeadId}
        open={clientOpen}
        onClose={() => {
          setClientOpen(false);
          setClientLeadId(null);
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

interface LeadRowProps {
  index: number;
  lead: CoffeeLead;
  isKeyboardActive: boolean;
  onOpen: () => void;
  onLogContact: () => void;
  onMarkAsClient: () => void;
  rowRef: (el: HTMLTableRowElement | null) => void;
}

function LeadRow({
  index,
  lead,
  isKeyboardActive,
  onOpen,
  onLogContact,
  onMarkAsClient,
  rowRef,
}: LeadRowProps) {
  const stage = (lead.contact_stage ?? 'not_contacted') as ContactStage;
  const attempts = lead.contact_attempts ?? 0;
  const isClient = !!lead.is_existing_client;
  const lastContacted = lead.last_contacted_at
    ? safeRelative(lead.last_contacted_at)
    : 'Never';

  return (
    <tr
      ref={rowRef}
      onClick={onOpen}
      className={`border-b border-border cursor-pointer transition-colors ${
        isKeyboardActive
          ? 'bg-[#1a1a14]'
          : isClient
            ? 'bg-[#C9A84C]/[0.035] hover:bg-[#C9A84C]/[0.07]'
            : 'hover:bg-secondary/30'
      }`}
    >
      <td className="px-4 py-3 text-muted-foreground text-xs">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isClient && (
            <span
              title={
                lead.became_client_at
                  ? `Client since ${new Date(lead.became_client_at).toLocaleDateString()}`
                  : 'Existing client'
              }
              aria-label="Existing client"
              className="inline-flex"
            >
              <Star
                className="w-4 h-4"
                style={{ color: GOLD, fill: GOLD }}
              />
            </span>
          )}
          <p className="font-medium text-foreground">{lead.business_name}</p>
        </div>
        {lead.state && (
          <p className="text-xs text-muted-foreground mt-0.5">{lead.state}</p>
        )}
      </td>
      <td className="px-4 py-3 text-foreground">{lead.suburb ?? '—'}</td>
      <td className="px-4 py-3">
        <RatingStars rating={lead.google_rating} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {lead.contact_phone ?? '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
        {lead.contact_email ?? (
          <span className="text-zinc-600">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${CONTACT_STAGE_PILL[stage]}`}
        >
          {CONTACT_STAGE_LABEL[stage]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[11px] font-semibold ${
            attempts > 0
              ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {attempts}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
        {lastContacted}
      </td>
      <td
        className="px-4 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center justify-end gap-2 flex-wrap">
          {!isClient && (
            <button
              onClick={onMarkAsClient}
              title="Mark as existing client"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[#C9A84C]/10"
              style={{ borderColor: `${GOLD}66`, color: GOLD }}
            >
              <Star className="w-3 h-3" />
              Already a Client
            </button>
          )}
          {isClient && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium border"
              style={{
                borderColor: `${GOLD}66`,
                color: GOLD,
                background: 'rgba(201,168,76,0.08)',
              }}
            >
              <Star className="w-3 h-3" style={{ fill: GOLD }} />
              Client
            </span>
          )}
          <button
            onClick={onLogContact}
            className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-muted-foreground transition-colors hover:border-[#C9A84C]/50 hover:text-foreground"
          >
            Log Contact
          </button>
        </div>
      </td>
    </tr>
  );
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-xs text-zinc-600">—</span>;
  }
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            color: i < full ? GOLD : '#3a3a3a',
            fill: i < full ? GOLD : 'none',
          }}
        />
      ))}
      <span className="text-xs ml-1 text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function safeRelative(ts: string): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return '—';
  }
}
