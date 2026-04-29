'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Mail,
  Search,
  Star,
  MapPin,
  Phone,
  ArrowUp,
  ArrowDown,
  Wand2,
  ListChecks,
  Gauge,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoffeeLeads } from '@/hooks/use-coffee-leads';
import type { CoffeeLead, Tone } from '@/lib/types';

const GOLD = '#C9A84C';
const BG = '#0A0A0A';

type Mode = 'personalised' | 'mass';

type CampaignRow = {
  id: string;
  name: string;
  status: 'sent' | 'draft' | 'sending';
  date: string;
  totalSent: number;
  openRate: number;
};

const TONES: Tone[] = ['Professional', 'Casual', 'Aggressive', 'Friendly', 'Urgent'];

const MASS_TEMPLATES: { id: string; name: string; subject: string; body: string }[] = [
  {
    id: 'initial',
    name: 'Initial Outreach',
    subject: 'Premium Melbourne coffee for {{business_name}}',
    body: `Hi {{contact_name}},

I'm reaching out from Roasting Warehouse — a Melbourne specialty coffee wholesaler. I've been admiring what you do at {{business_name}} in {{suburb}} (that {{google_rating}} Google rating speaks for itself).

We supply small-batch, freshly roasted beans to some of Melbourne's best cafés. I'd love to send you a sample box and have a quick chat about your current coffee program.

Open to it?

— Roasting Warehouse`,
  },
  {
    id: 'followup',
    name: 'Follow Up',
    subject: 'Quick follow-up — {{business_name}}',
    body: `Hi {{contact_name}},

Floating my last email back to the top in case it got buried. Still happy to drop off a tasting box at {{business_name}} this week — no obligation.

Worth a 10-minute chat?

— Roasting Warehouse`,
  },
  {
    id: 'tasting',
    name: 'Tasting Invite',
    subject: 'Tasting invite — {{business_name}} x Roasting Warehouse',
    body: `Hi {{contact_name}},

We're hosting a private cupping at our {{suburb}}-area roastery and I'd love to have you and the team at {{business_name}} along.

Pick a slot that suits and we'll handle the rest.

— Roasting Warehouse`,
  },
];

function applyTemplate(tpl: string, lead: CoffeeLead): string {
  return tpl
    .replace(/\{\{business_name\}\}/g, lead.business_name ?? '')
    .replace(/\{\{contact_name\}\}/g, lead.contact_name ?? 'there')
    .replace(/\{\{suburb\}\}/g, lead.suburb ?? 'Melbourne')
    .replace(/\{\{google_rating\}\}/g, lead.google_rating != null ? String(lead.google_rating) : '');
}

function GoldStars({ rating }: { rating: number | null | undefined }) {
  if (rating == null) return <span className="text-xs text-zinc-500">no rating</span>;
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
      <span className="text-xs ml-1 text-zinc-300">{rating.toFixed(1)}</span>
    </span>
  );
}

function ScoreArc({ score }: { score: number }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={radius} stroke="#222" strokeWidth="8" fill="none" />
        <motion.circle
          cx="46"
          cy="46"
          r={radius}
          stroke={GOLD}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          transform="rotate(-90 46 46)"
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color: GOLD }}>
        {score}
      </span>
    </div>
  );
}

interface AIOutreachCentreProps {
  preselectLeadId?: string | null;
  onPreselectHandled?: () => void;
}

export default function AIOutreachCentre({
  preselectLeadId,
  onPreselectHandled,
}: AIOutreachCentreProps) {
  const { leads, loading: leadsLoading, error: leadsError, setLeadEmailSent } = useCoffeeLeads();

  const [mode, setMode] = useState<Mode>('personalised');
  const [tone, setTone] = useState<Tone>('Professional');
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  // Personalised mode state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | string>(null);
  const [score, setScore] = useState<number | null>(null);
  const [scoreSummary, setScoreSummary] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [subjectVault, setSubjectVault] = useState<string[]>([]);

  // Mass blast state
  const [campaignName, setCampaignName] = useState('');
  const [selectedMassIds, setSelectedMassIds] = useState<Set<string>>(new Set());
  const [massTemplateId, setMassTemplateId] = useState<string>('initial');
  const [aiPerLead, setAiPerLead] = useState(false);
  const [massSubject, setMassSubject] = useState(MASS_TEMPLATES[0].subject);
  const [massBody, setMassBody] = useState(MASS_TEMPLATES[0].body);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<{
    sent: number;
    failed: number;
    total: number;
    current: string;
  } | null>(null);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const filteredDropdownLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    if (!q) return leads.slice(0, 50);
    return leads
      .filter(
        (l) =>
          l.business_name?.toLowerCase().includes(q) ||
          l.suburb?.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [leads, leadSearch]);

  // Apply preselected lead from URL/Map navigation.
  useEffect(() => {
    if (!preselectLeadId) return;
    if (leads.length === 0) return;
    setMode('personalised');
    setSelectedLeadId(preselectLeadId);
    onPreselectHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectLeadId, leads.length]);

  // Generate suggestions when lead is selected.
  useEffect(() => {
    if (!selectedLead) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: leadToContext(selectedLead) }),
    })
      .then(async (r) => (r.ok ? r.json() : { tips: [] }))
      .then((data) => {
        if (!cancelled) setSuggestions(Array.isArray(data.tips) ? data.tips : []);
      })
      .catch(() => !cancelled && setSuggestions([]))
      .finally(() => !cancelled && setSuggestionsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedLead]);

  async function handleGenerateEmail() {
    if (!selectedLead) return;
    setGenerating(true);
    setBody('');
    setScore(null);
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: leadToContext(selectedLead), tone }),
      });
      if (!res.ok || !res.body) {
        setBody(`[Error generating email: ${res.status}]`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setBody((prev) => prev + chunk);
      }
    } catch (err) {
      setBody(`[Error: ${(err as Error).message}]`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAiTool(instruction: string, label: string) {
    if (!body.trim() || !selectedLead) return;
    setAiBusy(label);
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: body,
          instruction,
          tone,
          lead: leadToContext(selectedLead),
        }),
      });
      const data = await res.json();
      if (data?.email) setBody(data.email);
    } finally {
      setAiBusy(null);
    }
  }

  async function handleScoreEmail() {
    if (!body.trim()) return;
    setAiBusy('score');
    setScore(null);
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: body, subject }),
      });
      const data = await res.json();
      if (typeof data?.score === 'number') {
        setScore(data.score);
        setScoreSummary(typeof data.summary === 'string' ? data.summary : '');
      }
    } finally {
      setAiBusy(null);
    }
  }

  async function handleGenerateSubjects() {
    if (!selectedLead) return;
    setAiBusy('subjects');
    try {
      const res = await fetch('/api/ai/subject-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: leadToContext(selectedLead),
          email: body,
          tone,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.subjects) && data.subjects.length > 0) {
        setSubjectVault((prev) => [...data.subjects, ...prev].slice(0, 5));
        if (!subject) setSubject(data.subjects[0]);
      }
    } finally {
      setAiBusy(null);
    }
  }

  async function handleSendSingle() {
    if (!selectedLead) return;
    if (!selectedLead.contact_email) {
      setSendStatus('This lead has no email address.');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setSendStatus('Subject and body required.');
      return;
    }
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          to: selectedLead.contact_email,
          subject,
          body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSendStatus(`Sent to ${selectedLead.business_name}.`);
        setLeadEmailSent(selectedLead.id);
      } else {
        setSendStatus(`Failed: ${data?.error ?? res.statusText}`);
      }
    } catch (err) {
      setSendStatus(`Failed: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  // Mass blast handlers
  function applyMassTemplate(id: string) {
    setMassTemplateId(id);
    const t = MASS_TEMPLATES.find((x) => x.id === id);
    if (t) {
      setMassSubject(t.subject);
      setMassBody(t.body);
    }
  }

  function toggleMassLead(id: string) {
    setSelectedMassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllMass() {
    setSelectedMassIds(new Set(leads.filter((l) => l.contact_email).map((l) => l.id)));
  }

  function selectHotMass() {
    setSelectedMassIds(
      new Set(leads.filter((l) => l.lead_status === 'hot' && l.contact_email).map((l) => l.id)),
    );
  }

  function selectNoEmailSentMass() {
    setSelectedMassIds(
      new Set(
        leads
          .filter((l) => (l.email_status == null || l.email_status === 'not_sent') && l.contact_email)
          .map((l) => l.id),
      ),
    );
  }

  async function launchCampaign() {
    if (selectedMassIds.size === 0 || !campaignName.trim()) return;
    setConfirmOpen(false);
    setLaunching(true);
    setLaunchProgress({ sent: 0, failed: 0, total: selectedMassIds.size, current: '' });

    const recipients = await Promise.all(
      Array.from(selectedMassIds).map(async (id) => {
        const lead = leads.find((l) => l.id === id);
        if (!lead || !lead.contact_email) return null;
        let perSubject = applyTemplate(massSubject, lead);
        let perBody = applyTemplate(massBody, lead);
        if (aiPerLead) {
          try {
            const r = await fetch('/api/ai/generate-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead: leadToContext(lead), tone }),
            });
            if (r.ok && r.body) {
              const reader = r.body.getReader();
              const dec = new TextDecoder();
              let txt = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                txt += dec.decode(value, { stream: true });
              }
              if (txt.trim()) perBody = txt.trim();
            }
          } catch {
            /* fall back to template */
          }
        }
        return {
          leadId: lead.id,
          to: lead.contact_email,
          subject: perSubject,
          body: perBody,
          businessName: lead.business_name,
        };
      }),
    );

    const validRecipients = recipients.filter(Boolean) as Array<{
      leadId: string;
      to: string;
      subject: string;
      body: string;
      businessName: string;
    }>;

    try {
      const res = await fetch('/api/email/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          recipients: validRecipients,
        }),
      });
      if (!res.ok || !res.body) {
        setLaunchProgress((p) => (p ? { ...p, current: `Error: ${res.status}` } : p));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'progress') {
              setLaunchProgress((p) =>
                p
                  ? {
                      ...p,
                      current: `${evt.businessName ?? evt.to} — ${evt.status}`,
                      sent: evt.status === 'sent' ? p.sent + 1 : p.sent,
                      failed: evt.status === 'failed' ? p.failed + 1 : p.failed,
                    }
                  : p,
              );
              if (evt.status === 'sent') setLeadEmailSent(evt.leadId ?? '');
            } else if (evt.type === 'done') {
              setCampaigns((prev) => [
                {
                  id: evt.campaignId ?? `local-${Date.now()}`,
                  name: campaignName,
                  status: 'sent',
                  date: new Date().toISOString().slice(0, 10),
                  totalSent: evt.sent ?? 0,
                  openRate: 0,
                },
                ...prev,
              ]);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } finally {
      setLaunching(false);
    }
  }

  const massStats = useMemo(() => {
    const ids = selectedMassIds;
    let withEmail = 0;
    let alreadyContacted = 0;
    leads.forEach((l) => {
      if (!ids.has(l.id)) return;
      if (l.contact_email) withEmail += 1;
      if (l.email_status === 'sent' || l.email_status === 'opened' || l.email_status === 'replied')
        alreadyContacted += 1;
    });
    return {
      selected: ids.size,
      withEmail,
      alreadyContacted,
      estMins: Math.max(1, Math.ceil(ids.size * 0.05)),
    };
  }, [selectedMassIds, leads]);

  return (
    <div
      className="flex w-full overflow-hidden border border-[#1f1f1f] rounded-xl"
      style={{ background: BG, height: 'calc(100vh - 8rem)' }}
    >
      {/* LEFT PANEL — Campaigns */}
      <aside className="w-[280px] border-r border-[#1f1f1f] flex flex-col">
        <div className="p-4 border-b border-[#1f1f1f]">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-black transition-all hover:brightness-110"
            style={{ background: GOLD }}
            onClick={() => {
              setMode('personalised');
              setSelectedLeadId(null);
              setSubject('');
              setBody('');
              setScore(null);
            }}
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500 px-2 pt-1">Past Campaigns</p>
          {campaigns.length === 0 && (
            <p className="text-sm text-zinc-500 px-2 py-6 text-center">No campaigns yet.</p>
          )}
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="px-3 py-2.5 rounded-lg bg-[#121212] border border-[#1f1f1f] hover:border-[#C9A84C]/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white truncate">{c.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    c.status === 'sent'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : c.status === 'sending'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-zinc-500/15 text-zinc-400'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                <span>{c.date}</span>
                <span>
                  {c.totalSent} sent · {c.openRate}% open
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CENTRE PANEL — Composer */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-[#1f1f1f]">
          {(['personalised', 'mass'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative pb-3 text-sm font-semibold tracking-wider uppercase transition-colors ${
                  active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m === 'personalised' ? 'Personalised' : 'Mass Blast'}
                {active && (
                  <motion.div
                    layoutId="mode-underline"
                    className="absolute left-0 right-0 -bottom-px h-0.5"
                    style={{ background: GOLD }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {leadsError && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              {leadsError}
            </div>
          )}

          {mode === 'personalised' ? (
            <PersonalisedView
              leads={leads}
              leadsLoading={leadsLoading}
              selectedLead={selectedLead}
              setSelectedLeadId={setSelectedLeadId}
              leadSearch={leadSearch}
              setLeadSearch={setLeadSearch}
              leadDropdownOpen={leadDropdownOpen}
              setLeadDropdownOpen={setLeadDropdownOpen}
              filteredDropdownLeads={filteredDropdownLeads}
              subject={subject}
              setSubject={setSubject}
              body={body}
              setBody={setBody}
              onGenerate={handleGenerateEmail}
              generating={generating}
              aiBusy={aiBusy}
              onAiTool={handleAiTool}
              onScore={handleScoreEmail}
              onSubjects={handleGenerateSubjects}
              score={score}
              scoreSummary={scoreSummary}
              onSend={handleSendSingle}
              sending={sending}
              sendStatus={sendStatus}
            />
          ) : (
            <MassBlastView
              leads={leads}
              campaignName={campaignName}
              setCampaignName={setCampaignName}
              selectedIds={selectedMassIds}
              toggleLead={toggleMassLead}
              selectAll={selectAllMass}
              selectHot={selectHotMass}
              selectNoEmailSent={selectNoEmailSentMass}
              templates={MASS_TEMPLATES}
              templateId={massTemplateId}
              applyMassTemplate={applyMassTemplate}
              aiPerLead={aiPerLead}
              setAiPerLead={setAiPerLead}
              massSubject={massSubject}
              setMassSubject={setMassSubject}
              massBody={massBody}
              setMassBody={setMassBody}
              onLaunch={() => setConfirmOpen(true)}
              canLaunch={selectedMassIds.size > 0 && campaignName.trim().length > 0 && !launching}
            />
          )}
        </div>
      </section>

      {/* RIGHT PANEL — AI Assistant */}
      <aside className="w-[320px] border-l border-[#1f1f1f] flex flex-col">
        <div className="p-4 border-b border-[#1f1f1f]">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} /> AI Assistant
          </p>
          <p className="text-xs text-zinc-400">Tone</p>
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {TONES.map((t) => {
              const active = tone === t;
              return (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`text-[11px] px-2 py-1.5 rounded-md border transition-all ${
                    active
                      ? 'border-[#C9A84C] text-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.25)]'
                      : 'border-[#2a2a2a] text-zinc-400 hover:border-[#C9A84C]/40'
                  }`}
                  style={active ? { background: 'rgba(201,168,76,0.08)' } : undefined}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Smart suggestions */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Smart Suggestions</p>
            {!selectedLead && mode === 'personalised' && (
              <p className="text-xs text-zinc-600">Select a lead to see AI tips.</p>
            )}
            {suggestionsLoading && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking…
              </div>
            )}
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="text-xs text-zinc-300 border-l-2 pl-2.5 py-1"
                  style={{ borderColor: GOLD }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Subject line vault */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Subject Line Vault</p>
            {subjectVault.length === 0 ? (
              <p className="text-xs text-zinc-600">Generate subjects from the composer.</p>
            ) : (
              <div className="space-y-1.5">
                {subjectVault.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSubject(s)}
                    className="w-full text-left text-xs px-2.5 py-2 rounded-md bg-[#121212] border border-[#1f1f1f] hover:border-[#C9A84C]/40 text-zinc-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campaign stats — mass mode */}
          {mode === 'mass' && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Campaign Stats</p>
              <div className="space-y-1.5 text-xs">
                <Stat label="Selected" value={`${massStats.selected} leads`} />
                <Stat label="Have email" value={`${massStats.withEmail} leads`} />
                <Stat label="Already contacted" value={`${massStats.alreadyContacted} leads`} />
                <Stat label="Est. send time" value={`${massStats.estMins} mins`} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mass blast confirm modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Launch campaign?</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Sending to <span className="text-white font-semibold">{selectedMassIds.size} leads</span>. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-[#1a1a1a]"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-black"
                  style={{ background: GOLD }}
                  onClick={launchCampaign}
                >
                  Launch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live launch progress */}
      <AnimatePresence>
        {launching && launchProgress && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-80 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Sending {launchProgress.sent + launchProgress.failed}/{launchProgress.total}…
              </p>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD }} />
            </div>
            <p className="text-xs text-zinc-400 mt-1 truncate">{launchProgress.current}</p>
            <div className="h-1.5 mt-3 rounded-full bg-[#1a1a1a] overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: GOLD }}
                animate={{
                  width: `${
                    ((launchProgress.sent + launchProgress.failed) / launchProgress.total) * 100
                  }%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function leadToContext(lead: CoffeeLead) {
  return {
    business_name: lead.business_name,
    contact_name: lead.contact_name,
    suburb: lead.suburb,
    state: lead.state,
    google_rating: lead.google_rating,
    pipeline_stage: lead.pipeline_stage,
    lead_status: lead.lead_status,
    email_status: lead.email_status,
    notes: lead.notes,
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-2.5 py-1.5 rounded-md bg-[#121212] border border-[#1f1f1f]">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

interface PersonalisedViewProps {
  leads: CoffeeLead[];
  leadsLoading: boolean;
  selectedLead: CoffeeLead | null;
  setSelectedLeadId: (id: string | null) => void;
  leadSearch: string;
  setLeadSearch: (v: string) => void;
  leadDropdownOpen: boolean;
  setLeadDropdownOpen: (v: boolean) => void;
  filteredDropdownLeads: CoffeeLead[];
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  aiBusy: string | null;
  onAiTool: (instruction: string, label: string) => void;
  onScore: () => void;
  onSubjects: () => void;
  score: number | null;
  scoreSummary: string;
  onSend: () => void;
  sending: boolean;
  sendStatus: string | null;
}

function PersonalisedView(p: PersonalisedViewProps) {
  return (
    <div className="space-y-4">
      {/* Lead selector */}
      <div className="relative">
        <button
          onClick={() => p.setLeadDropdownOpen(!p.leadDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#121212] border border-[#1f1f1f] text-left text-sm text-zinc-300 hover:border-[#C9A84C]/40"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-500" />
            {p.selectedLead
              ? `${p.selectedLead.business_name} — ${p.selectedLead.suburb ?? ''}`
              : 'Search a lead by business name…'}
          </span>
          <span className="text-xs text-zinc-500">{p.leads.length} leads</span>
        </button>
        {p.leadDropdownOpen && (
          <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg shadow-xl">
            <div className="p-2 sticky top-0 bg-[#0f0f0f] border-b border-[#1f1f1f]">
              <input
                value={p.leadSearch}
                onChange={(e) => p.setLeadSearch(e.target.value)}
                placeholder="Type to filter…"
                className="w-full px-2.5 py-1.5 text-sm bg-[#121212] border border-[#1f1f1f] rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#C9A84C]/50"
                autoFocus
              />
            </div>
            {p.leadsLoading && (
              <p className="text-xs text-zinc-500 px-3 py-3">Loading…</p>
            )}
            {p.filteredDropdownLeads.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  p.setSelectedLeadId(l.id);
                  p.setLeadDropdownOpen(false);
                  p.setLeadSearch('');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#1a1a1a]"
              >
                <div className="min-w-0">
                  <div className="text-white truncate">{l.business_name}</div>
                  <div className="text-xs text-zinc-500 truncate">{l.suburb ?? '—'}</div>
                </div>
                <GoldStars rating={l.google_rating} />
              </button>
            ))}
            {!p.leadsLoading && p.filteredDropdownLeads.length === 0 && (
              <p className="text-xs text-zinc-500 px-3 py-4 text-center">No leads.</p>
            )}
          </div>
        )}
      </div>

      {/* Lead card */}
      {p.selectedLead && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#1f1f1f] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{p.selectedLead.business_name}</h3>
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {p.selectedLead.suburb ?? '—'}, {p.selectedLead.state ?? ''}
                </span>
                {p.selectedLead.contact_phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {p.selectedLead.contact_phone}
                  </span>
                )}
                {p.selectedLead.contact_email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {p.selectedLead.contact_email}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <GoldStars rating={p.selectedLead.google_rating} />
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#2a2a2a] text-zinc-300">
                  {p.selectedLead.pipeline_stage ?? 'new'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subject + body */}
      <div className="space-y-2">
        <input
          value={p.subject}
          onChange={(e) => p.setSubject(e.target.value)}
          placeholder="Subject line…"
          className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#1f1f1f] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C9A84C]/50"
        />
        <textarea
          value={p.body}
          onChange={(e) => p.setBody(e.target.value)}
          placeholder="Email body — or hit AI Generate."
          rows={14}
          className="w-full px-3 py-2.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f] text-zinc-100 text-sm leading-relaxed font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#C9A84C]/50 resize-none"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        />
      </div>

      {/* AI generate + tools row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={p.onGenerate}
          disabled={!p.selectedLead || p.generating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
          style={{ background: GOLD }}
        >
          {p.generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> AI is thinking…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> AI Generate
            </>
          )}
        </button>

        <ToolButton
          label="More Aggressive"
          icon={<ArrowUp className="w-3.5 h-3.5" />}
          busy={p.aiBusy === 'aggr'}
          disabled={!p.body.trim() || !!p.aiBusy}
          onClick={() => p.onAiTool('Make this email more aggressive and direct.', 'aggr')}
        />
        <ToolButton
          label="Soften"
          icon={<ArrowDown className="w-3.5 h-3.5" />}
          busy={p.aiBusy === 'soft'}
          disabled={!p.body.trim() || !!p.aiBusy}
          onClick={() => p.onAiTool('Soften the tone of this email — warmer and friendlier.', 'soft')}
        />
        <ToolButton
          label="Rewrite"
          icon={<Wand2 className="w-3.5 h-3.5" />}
          busy={p.aiBusy === 'rewrite'}
          disabled={!p.body.trim() || !!p.aiBusy}
          onClick={() => p.onAiTool('Rewrite this email with a fresh angle, keeping all key facts.', 'rewrite')}
        />
        <ToolButton
          label="5 Subject Lines"
          icon={<ListChecks className="w-3.5 h-3.5" />}
          busy={p.aiBusy === 'subjects'}
          disabled={!p.selectedLead || !!p.aiBusy}
          onClick={p.onSubjects}
        />
        <ToolButton
          label="Score It"
          icon={<Gauge className="w-3.5 h-3.5" />}
          busy={p.aiBusy === 'score'}
          disabled={!p.body.trim() || !!p.aiBusy}
          onClick={p.onScore}
        />
      </div>

      {p.score != null && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] p-4 flex items-center gap-4">
          <ScoreArc score={p.score} />
          <div>
            <p className="text-sm font-semibold text-white">Effectiveness score</p>
            {p.scoreSummary && <p className="text-xs text-zinc-400 mt-1">{p.scoreSummary}</p>}
          </div>
        </div>
      )}

      {/* Send */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1f1f1f]">
        {p.sendStatus && <span className="text-xs text-zinc-400">{p.sendStatus}</span>}
        <button
          onClick={p.onSend}
          disabled={!p.selectedLead || !p.subject.trim() || !p.body.trim() || p.sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
          style={{ background: GOLD }}
        >
          {p.sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  busy,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2a2a2a] text-xs text-zinc-300 hover:border-[#C9A84C]/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

interface MassBlastViewProps {
  leads: CoffeeLead[];
  campaignName: string;
  setCampaignName: (v: string) => void;
  selectedIds: Set<string>;
  toggleLead: (id: string) => void;
  selectAll: () => void;
  selectHot: () => void;
  selectNoEmailSent: () => void;
  templates: typeof MASS_TEMPLATES;
  templateId: string;
  applyMassTemplate: (id: string) => void;
  aiPerLead: boolean;
  setAiPerLead: (v: boolean) => void;
  massSubject: string;
  setMassSubject: (v: string) => void;
  massBody: string;
  setMassBody: (v: string) => void;
  onLaunch: () => void;
  canLaunch: boolean;
}

function MassBlastView(p: MassBlastViewProps) {
  const previewLead = p.leads.find((l) => p.selectedIds.has(l.id));
  const previewSubject = previewLead ? applyTemplate(p.massSubject, previewLead) : p.massSubject;
  const previewBody = previewLead ? applyTemplate(p.massBody, previewLead) : p.massBody;

  return (
    <div className="space-y-4">
      <input
        value={p.campaignName}
        onChange={(e) => p.setCampaignName(e.target.value)}
        placeholder="Campaign name…"
        className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#1f1f1f] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C9A84C]/50"
      />

      {/* Quick filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <QuickFilter onClick={p.selectAll}>Select All</QuickFilter>
        <QuickFilter onClick={p.selectHot}>Select Hot Leads</QuickFilter>
        <QuickFilter onClick={p.selectNoEmailSent}>Select No Email Sent</QuickFilter>
        <span
          className="ml-auto text-xs px-2.5 py-1 rounded-full border"
          style={{ borderColor: GOLD, color: GOLD, background: 'rgba(201,168,76,0.05)' }}
        >
          {p.selectedIds.size} leads selected
        </span>
      </div>

      {/* Lead table */}
      <div className="rounded-xl border border-[#1f1f1f] overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#121212] sticky top-0">
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Suburb</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {p.leads.map((l) => {
                const checked = p.selectedIds.has(l.id);
                return (
                  <tr
                    key={l.id}
                    onClick={() => p.toggleLead(l.id)}
                    className={`border-t border-[#1a1a1a] cursor-pointer hover:bg-[#141414] ${
                      checked ? 'bg-[#1a1a14]' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => p.toggleLead(l.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-[#C9A84C]"
                      />
                    </td>
                    <td className="px-3 py-2 text-white">{l.business_name}</td>
                    <td className="px-3 py-2 text-zinc-400">{l.suburb ?? '—'}</td>
                    <td className="px-3 py-2">
                      <GoldStars rating={l.google_rating} />
                    </td>
                    <td className="px-3 py-2 text-zinc-400 truncate max-w-[180px]">
                      {l.contact_email ?? <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-300">
                        {l.email_status ?? 'not_sent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {p.leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-xs text-zinc-500">
                    No leads loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-3 gap-2">
        {p.templates.map((t) => {
          const active = p.templateId === t.id && !p.aiPerLead;
          return (
            <button
              key={t.id}
              onClick={() => {
                p.setAiPerLead(false);
                p.applyMassTemplate(t.id);
              }}
              className={`text-left p-3 rounded-lg border transition-all ${
                active
                  ? 'border-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.2)]'
                  : 'border-[#1f1f1f] hover:border-[#C9A84C]/40'
              }`}
              style={active ? { background: 'rgba(201,168,76,0.08)' } : { background: '#121212' }}
            >
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: active ? GOLD : '#888' }}
              >
                {t.name}
              </p>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.subject}</p>
            </button>
          );
        })}
      </div>

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={p.aiPerLead}
          onChange={(e) => p.setAiPerLead(e.target.checked)}
          className="accent-[#C9A84C]"
        />
        <span className="text-sm text-zinc-300 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} /> AI Generate For Each Lead
        </span>
      </label>

      <input
        value={p.massSubject}
        onChange={(e) => p.setMassSubject(e.target.value)}
        placeholder="Subject line — supports {{business_name}}, {{suburb}}, {{contact_name}}, {{google_rating}}"
        className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#1f1f1f] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C9A84C]/50"
      />
      <textarea
        value={p.massBody}
        onChange={(e) => p.setMassBody(e.target.value)}
        rows={10}
        className="w-full px-3 py-2.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f] text-zinc-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#C9A84C]/50 resize-none"
      />

      {/* Preview */}
      {previewLead && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            Preview · {previewLead.business_name}
          </p>
          <p className="text-sm text-white">{previewSubject}</p>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono mt-2 max-h-48 overflow-y-auto">
            {previewBody}
          </pre>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={p.onLaunch}
          disabled={!p.canLaunch}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
          style={{ background: GOLD }}
        >
          <Send className="w-4 h-4" /> Launch Campaign
        </button>
      </div>
    </div>
  );
}

function QuickFilter({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-zinc-300 hover:border-[#C9A84C]/50 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}
