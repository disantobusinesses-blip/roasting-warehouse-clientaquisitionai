'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Map as MapIcon,
  Sparkles,
  PhoneCall,
  Loader2,
  Minus,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLeads } from '@/context/leads-context';
import {
  CONTACT_STAGES,
  CONTACT_STAGE_LABEL,
  type ContactActivity,
  type ContactStage,
} from '@/lib/types';

const GOLD = '#C9A84C';

interface LeadDetailDrawerProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onDraftOutreach?: (leadId: string) => void;
}

export default function LeadDetailDrawer({
  leadId,
  open,
  onClose,
  onDraftOutreach,
}: LeadDetailDrawerProps) {
  const {
    leads,
    setLeadStage,
    setAttempts,
    saveNotes,
    logContact,
    getActivity,
  } = useLeads();

  const lead = leadId ? leads.find((l) => l.id === leadId) ?? null : null;

  // Local notes mirror for textarea; syncs with lead.contact_notes.
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesStatus, setNotesStatus] = useState<string | null>(null);

  const [stageSaving, setStageSaving] = useState<ContactStage | null>(null);

  const [activity, setActivity] = useState<ContactActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Inline call form
  const [callOpen, setCallOpen] = useState(false);
  const [callOutcome, setCallOutcome] = useState('reached');
  const [callNotes, setCallNotes] = useState('');
  const [callSaving, setCallSaving] = useState(false);

  // Reset drawer state when lead changes / drawer opens
  useEffect(() => {
    if (!open || !lead) return;
    setNotesDraft(lead.contact_notes ?? '');
    setNotesStatus(null);
    setCallOpen(false);
    setCallOutcome('reached');
    setCallNotes('');
  }, [open, lead?.id]);

  // Fetch activity history
  const refreshActivity = useCallback(async () => {
    if (!lead) return;
    setActivityLoading(true);
    const rows = await getActivity(lead.id);
    setActivity(rows);
    setActivityLoading(false);
  }, [lead?.id, getActivity]);

  useEffect(() => {
    if (open && lead) {
      void refreshActivity();
    }
  }, [open, lead?.id, refreshActivity]);

  // Escape closes drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !lead) {
    return (
      <Backdrop
        open={open}
        onClose={onClose}
      />
    );
  }

  const currentStage = (lead.contact_stage ?? 'not_contacted') as ContactStage;
  const attempts = lead.contact_attempts ?? 0;

  const handleStageClick = async (stage: ContactStage) => {
    setStageSaving(stage);
    try {
      await setLeadStage(lead.id, stage);
      // Refresh activity to show new row
      await refreshActivity();
    } finally {
      setStageSaving(null);
    }
  };

  const handleAttempts = async (delta: number) => {
    const next = Math.max(0, attempts + delta);
    await setAttempts(lead.id, next);
  };

  const handleNotesBlur = async () => {
    if (notesDraft === (lead.contact_notes ?? '')) return;
    setNotesSaving(true);
    setNotesStatus(null);
    try {
      await saveNotes(lead.id, notesDraft);
      setNotesStatus('Saved');
      setTimeout(() => setNotesStatus(null), 1500);
    } catch (err) {
      setNotesStatus(
        `Error: ${err instanceof Error ? err.message : 'Failed'}`,
      );
    } finally {
      setNotesSaving(false);
    }
  };

  const handleLogCall = async () => {
    setCallSaving(true);
    try {
      await logContact({
        leadId: lead.id,
        stage: currentStage === 'not_contacted' ? 'contacted' : currentStage,
        channel: 'phone',
        outcome: callOutcome,
        notes: callNotes.trim() || null,
      });
      await refreshActivity();
      setCallOpen(false);
      setCallNotes('');
    } finally {
      setCallSaving(false);
    }
  };

  return (
    <>
      <Backdrop open={open} onClose={onClose} />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-card border-l border-border overflow-y-auto"
        style={{ transform: 'translateX(0)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details for ${lead.business_name}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">
              {lead.business_name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {[lead.suburb, lead.state].filter(Boolean).join(', ') || '—'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <RatingStars rating={lead.google_rating} />
              {lead.google_maps_url && (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#C9A84C] hover:underline inline-flex items-center gap-1"
                >
                  <MapIcon className="w-3 h-3" /> Maps
                </a>
              )}
              {lead.website && (
                <a
                  href={normalizeUrl(lead.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#C9A84C] hover:underline inline-flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact info */}
          <section>
            <SectionLabel>Contact Info</SectionLabel>
            <div className="grid grid-cols-1 gap-2 p-4 rounded-lg bg-secondary/40 border border-border">
              <InfoRow
                icon={<Phone className="w-4 h-4" />}
                value={lead.contact_phone}
                href={lead.contact_phone ? `tel:${lead.contact_phone}` : undefined}
                empty="No phone"
              />
              <InfoRow
                icon={<Mail className="w-4 h-4" />}
                value={lead.contact_email}
                href={lead.contact_email ? `mailto:${lead.contact_email}` : undefined}
                empty="No email"
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                value={[lead.suburb, lead.state].filter(Boolean).join(', ') || null}
                empty="No address"
              />
            </div>
          </section>

          {/* Stage selector */}
          <section>
            <SectionLabel>Contact Stage</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {CONTACT_STAGES.map((s) => {
                const active = s === currentStage;
                const busy = stageSaving === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStageClick(s)}
                    disabled={stageSaving !== null}
                    className={`relative text-xs font-medium px-2.5 py-2.5 rounded-lg border transition-all ${
                      active
                        ? 'text-black shadow-[0_0_18px_rgba(201,168,76,0.35)]'
                        : 'border-[#2a2a2a] text-zinc-300 hover:border-[#C9A84C]/50 hover:text-foreground'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={
                      active
                        ? { background: GOLD, borderColor: GOLD }
                        : { background: '#121212' }
                    }
                  >
                    {busy && (
                      <Loader2 className="w-3 h-3 animate-spin absolute top-1.5 right-1.5" />
                    )}
                    {CONTACT_STAGE_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Attempts counter */}
          <section>
            <SectionLabel>Contact Attempts</SectionLabel>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/40 border border-border">
              <div>
                <p className="text-3xl font-bold text-foreground">{attempts}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.last_contacted_at
                    ? `Last: ${safeRelative(lead.last_contacted_at)}`
                    : 'Never contacted'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAttempts(-1)}
                  disabled={attempts <= 0}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[#2a2a2a] text-zinc-300 hover:border-[#C9A84C]/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease attempts"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAttempts(1)}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[#2a2a2a] text-zinc-300 hover:border-[#C9A84C]/50 hover:text-foreground transition-colors"
                  aria-label="Increase attempts"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <SectionLabel className="!mb-0">Notes</SectionLabel>
              {notesSaving && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {notesStatus && (
                <span
                  className={`text-[10px] flex items-center gap-1 ${
                    notesStatus.startsWith('Error')
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" /> {notesStatus}
                </span>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleNotesBlur}
              rows={4}
              placeholder="Add notes about this lead..."
              className="w-full bg-[#121212] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/50 resize-none"
            />
          </section>

          {/* Activity history */}
          <section>
            <SectionLabel>Activity History</SectionLabel>
            {activityLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-md bg-secondary/40 animate-pulse"
                  />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 rounded-lg bg-secondary/30 border border-border">
                No contact history yet.
              </p>
            ) : (
              <ol className="space-y-2 relative pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-px before:bg-border">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="relative pl-3 py-2 rounded-md bg-secondary/20 border border-border"
                  >
                    <span
                      className="absolute -left-3 top-3 w-2 h-2 rounded-full"
                      style={{ background: GOLD }}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">
                          <span className="font-medium">
                            #{a.attempt_number ?? '—'}
                          </span>
                          <span className="text-muted-foreground"> · </span>
                          <span>
                            {a.stage
                              ? CONTACT_STAGE_LABEL[a.stage as ContactStage] ??
                                a.stage
                              : '—'}
                          </span>
                          {a.channel && (
                            <>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-muted-foreground">
                                {a.channel}
                              </span>
                            </>
                          )}
                          {a.outcome && (
                            <>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-muted-foreground">
                                {a.outcome}
                              </span>
                            </>
                          )}
                        </p>
                        {a.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {safeRelative(a.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Sticky footer — quick actions */}
        <div className="sticky bottom-0 z-10 bg-card border-t border-border p-4 space-y-3">
          {callOpen ? (
            <div className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Log a Call
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="bg-[#121212] border border-[#1f1f1f] rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#C9A84C]/50"
                >
                  <option value="reached">Reached</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="no_answer">No Answer</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                </select>
                <input
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Quick note…"
                  className="bg-[#121212] border border-[#1f1f1f] rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCallOpen(false)}
                  disabled={callSaving}
                  className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogCall}
                  disabled={callSaving}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-black disabled:opacity-50 transition-all hover:brightness-110"
                  style={{ background: GOLD }}
                >
                  {callSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDraftOutreach?.(lead.id)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-semibold text-black text-sm transition-all hover:brightness-110"
                style={{ background: GOLD }}
              >
                <Sparkles className="w-4 h-4" />
                Draft Outreach Email
              </button>
              <button
                onClick={() => setCallOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#2a2a2a] text-foreground text-sm hover:border-[#C9A84C]/50 transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                Log a Call
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Backdrop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 transition-opacity"
      onClick={onClose}
    />
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-wider text-muted-foreground mb-2 ${
        className ?? ''
      }`}
    >
      {children}
    </p>
  );
}

function InfoRow({
  icon,
  value,
  href,
  empty,
}: {
  icon: React.ReactNode;
  value: string | null;
  href?: string;
  empty: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        <span>{empty}</span>
      </div>
    );
  }
  const content = (
    <div className="flex items-center gap-3 text-sm text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="hover:text-[#C9A84C] transition-colors">
        {content}
      </a>
    );
  }
  return content;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-xs text-muted-foreground">no rating</span>;
  }
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
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

function normalizeUrl(u: string): string {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function safeRelative(ts: string): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return '—';
  }
}
