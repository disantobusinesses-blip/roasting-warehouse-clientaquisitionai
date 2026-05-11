'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Users, MessageSquare, Inbox, Trophy, Activity } from 'lucide-react';
import { useLeads } from '@/context/leads-context';
import {
  CONTACT_STAGES,
  CONTACT_STAGE_LABEL,
  type ContactStage,
} from '@/lib/types';

const GOLD = '#C9A84C';
const RESPONDED_STAGES: ContactStage[] = [
  'responded',
  'tasting_booked',
  'proposal_sent',
  'negotiating',
  'onboarded',
  'acquired',
];

interface DashboardProps {
  onNavigateToLeads: () => void;
}

export default function Dashboard({ onNavigateToLeads }: DashboardProps) {
  const {
    leads,
    loading,
    recentActivity,
    recentActivityLoading,
  } = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(
      (l) => l.contact_stage && l.contact_stage !== 'not_contacted',
    ).length;
    const responded = leads.filter(
      (l) =>
        l.contact_stage &&
        RESPONDED_STAGES.includes(l.contact_stage as ContactStage),
    ).length;
    const acquired = leads.filter((l) => l.contact_stage === 'acquired').length;
    return { total, contacted, responded, acquired };
  }, [leads]);

  const stageData = useMemo(() => {
    const counts = new Map<ContactStage, number>();
    leads.forEach((l) => {
      const s = (l.contact_stage ?? 'not_contacted') as ContactStage;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
    // Preserve canonical stage order, filter zeros.
    return CONTACT_STAGES
      .filter((s) => (counts.get(s) ?? 0) > 0)
      .map((s) => ({
        stage: s,
        label: CONTACT_STAGE_LABEL[s],
        count: counts.get(s) ?? 0,
      }));
  }, [leads]);

  const leadById = useMemo(() => {
    const m = new Map<string, string>();
    leads.forEach((l) => m.set(l.id, l.business_name));
    return m;
  }, [leads]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Live overview of your B2B sales pipeline
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          accent="text-foreground"
          bg="bg-secondary"
        />
        <StatCard
          label="Contacted"
          value={stats.contacted}
          icon={<MessageSquare className="w-5 h-5" />}
          accent="text-blue-300"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="Responded"
          value={stats.responded}
          icon={<Inbox className="w-5 h-5" />}
          accent="text-amber-300"
          bg="bg-amber-500/10"
        />
        <StatCard
          label="Acquired"
          value={stats.acquired}
          icon={<Trophy className="w-5 h-5" />}
          accent="text-[#C9A84C]"
          bg="bg-[#C9A84C]/10"
        />
      </div>

      {/* Stage breakdown chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4" style={{ color: GOLD }} />
          <h3 className="font-semibold text-foreground">Contact Stage Breakdown</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Live count per stage from <code className="text-zinc-400">coffee_leads</code>
        </p>

        {stageData.length === 0 ? (
          <EmptyChart onNavigateToLeads={onNavigateToLeads} />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, stageData.length * 48)}
          >
            <BarChart
              data={stageData}
              layout="vertical"
              margin={{ left: 24, right: 32, top: 4, bottom: 4 }}
              barSize={20}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="#1f1f1f"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                width={130}
                tick={{ fill: '#bdbdbd', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(201,168,76,0.05)' }}
                contentStyle={{
                  backgroundColor: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#fff',
                }}
                formatter={(value: number) => [value, 'Leads']}
                labelStyle={{ color: '#C9A84C' }}
              />
              <Bar
                dataKey="count"
                fill={GOLD}
                radius={[0, 4, 4, 0]}
                isAnimationActive
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: '#C9A84C', fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent activity feed */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Live from contact_activity
          </span>
        </div>

        {recentActivityLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-md bg-secondary/40 animate-pulse"
              />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No activity yet. Log a contact from a lead to start your activity feed.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((a) => {
              const stageLabel =
                a.stage && CONTACT_STAGE_LABEL[a.stage as ContactStage]
                  ? CONTACT_STAGE_LABEL[a.stage as ContactStage]
                  : a.stage ?? '—';
              const channel = a.channel ?? '—';
              const note = a.notes?.trim() || '—';
              const business = leadById.get(a.lead_id) ?? 'Unknown lead';
              const when = (() => {
                try {
                  return formatDistanceToNow(new Date(a.created_at), {
                    addSuffix: true,
                  });
                } catch {
                  return '';
                }
              })();
              return (
                <li
                  key={a.id}
                  className="py-3 flex items-start gap-3 text-sm"
                >
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: GOLD }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">
                      <span className="font-medium">{business}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-foreground">{stageLabel}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground">{channel}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground">{note}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {when}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  bg,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-[#C9A84C]/40 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            {label}
          </p>
          <p className={`text-3xl font-bold ${accent}`}>{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${bg} ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

function EmptyChart({ onNavigateToLeads }: { onNavigateToLeads: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted-foreground mb-3">
        No leads have a stage yet.
      </p>
      <button
        onClick={onNavigateToLeads}
        className="text-xs uppercase tracking-wider px-4 py-2 rounded-md border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
      >
        Go to Leads
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-secondary/60 rounded" />
        <div className="h-4 w-72 bg-secondary/40 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-secondary/40 rounded-xl border border-border"
          />
        ))}
      </div>
      <div className="h-64 bg-secondary/30 rounded-xl border border-border" />
      <div className="h-48 bg-secondary/30 rounded-xl border border-border" />
    </div>
  );
}
