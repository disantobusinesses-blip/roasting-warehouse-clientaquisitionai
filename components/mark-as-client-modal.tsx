'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { useLeads } from '@/context/leads-context';

const GOLD = '#C9A84C';

interface MarkAsClientModalProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onConfirmed?: (leadId: string) => void;
}

export default function MarkAsClientModal({
  leadId,
  open,
  onClose,
  onConfirmed,
}: MarkAsClientModalProps) {
  const { leads, markAsClient } = useLeads();
  const lead = leadId ? leads.find((l) => l.id === leadId) ?? null : null;
  const [saving, setSaving] = useState(false);

  // Reset when reopened.
  useEffect(() => {
    if (open) setSaving(false);
  }, [open, leadId]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, saving]);

  if (!open || !lead) return null;

  const handleConfirm = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await markAsClient(lead.id);
      onConfirmed?.(lead.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Mark as existing client"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ background: `${GOLD}26` }}
            >
              <Star
                className="w-5 h-5"
                style={{ color: GOLD, fill: GOLD }}
              />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Mark as Existing Client
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action will move the lead to the Clients list.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 -mr-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Mark{' '}
            <span className="font-semibold" style={{ color: GOLD }}>
              {lead.business_name}
            </span>{' '}
            as an existing client?
          </p>

          <ul className="text-xs text-muted-foreground space-y-1.5 bg-secondary/40 border border-border rounded-lg p-3">
            <li>
              ·&nbsp;Contact stage will be set to{' '}
              <span className="text-[#C9A84C] font-medium">Acquired</span>
            </li>
            <li>·&nbsp;A gold star will appear next to this lead</li>
            <li>·&nbsp;It will be available under the Clients filter</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/20 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md text-black disabled:opacity-60 transition-all hover:brightness-110"
            style={{ background: GOLD }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                Yes, Mark as Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
