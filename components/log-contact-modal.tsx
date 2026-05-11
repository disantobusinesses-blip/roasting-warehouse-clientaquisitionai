'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLeads } from '@/context/leads-context';
import {
  CONTACT_STAGES,
  CONTACT_STAGE_LABEL,
  type ContactStage,
} from '@/lib/types';

const GOLD = '#C9A84C';

const CHANNELS: { value: string; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Other' },
];

const OUTCOMES: { value: string; label: string }[] = [
  { value: 'reached', label: 'Reached' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
];

interface LogContactModalProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function LogContactModal({
  leadId,
  open,
  onClose,
}: LogContactModalProps) {
  const { leads, logContact } = useLeads();
  const lead = leadId ? leads.find((l) => l.id === leadId) : null;

  const [stage, setStage] = useState<ContactStage>('contacted');
  const [channel, setChannel] = useState<string>('phone');
  const [outcome, setOutcome] = useState<string>('reached');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Reset form on open / lead change
  useEffect(() => {
    if (open) {
      setStage((lead?.contact_stage as ContactStage) ?? 'contacted');
      setChannel('phone');
      setOutcome('reached');
      setNotes('');
      setStatus(null);
      setSaving(false);
    }
  }, [open, lead?.id, lead?.contact_stage]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !lead) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await logContact({
        leadId: lead.id,
        stage,
        channel,
        outcome,
        notes: notes.trim() || null,
      });
      setStatus('Saved');
      // Brief delay so user sees confirmation, then close.
      setTimeout(onClose, 400);
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : 'Failed to save'}`,
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Log contact"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Log Contact
            </p>
            <h3 className="text-base font-semibold text-foreground truncate">
              {lead.business_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          {/* Stage */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as ContactStage)}
              className="w-full bg-[#121212] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#C9A84C]/50"
            >
              {CONTACT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {CONTACT_STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Channel + Outcome row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[#121212] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#C9A84C]/50"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-[#121212] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#C9A84C]/50"
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? Short note..."
              className="w-full bg-[#121212] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/50"
              autoFocus
            />
          </div>

          {status && (
            <p
              className={`text-xs ${
                status.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {status}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1f1f1f] flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-foreground hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-all hover:brightness-110"
            style={{ background: GOLD }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
