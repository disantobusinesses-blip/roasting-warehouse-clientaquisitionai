'use client';

import { useClients } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

interface DashboardProps {
  onNavigateToClients: () => void;
}

const TEMP_COLORS: Record<string, string> = {
  Cold: '#93c5fd',
  Warm: '#fdba74',
  Responded: '#86efac',
  Acquired: '#4ade80',
};

export default function Dashboard({ onNavigateToClients }: DashboardProps) {
  const { clients, loading } = useClients();

  const totalLeads = clients.length;
  const cold = clients.filter(c => c.leadTemperature === 'cold').length;
  const warm = clients.filter(c => c.leadTemperature === 'warm').length;
  const responded = clients.filter(c => c.leadTemperature === 'responded').length;
  const acquired = clients.filter(c => c.status === 'customer').length;
  const aiAcquired = clients.filter(c => c.aiAcquired && c.status === 'customer').length;

  const temperatureData = [
    { label: 'Cold', count: cold },
    { label: 'Warm', count: warm },
    { label: 'Responded', count: responded },
    { label: 'Acquired', count: acquired },
  ];

  const aiCounts = clients.reduce(
    (acc, c) => {
      if (!c.aiAcquired) return acc;
      if (c.leadTemperature === 'cold') acc.cold++;
      else if (c.leadTemperature === 'warm') acc.warm++;
      else if (c.leadTemperature === 'responded') acc.responded++;
      if (c.status === 'customer') acc.acquired++;
      return acc;
    },
    { cold: 0, warm: 0, responded: 0, acquired: 0 }
  );
  const aiAcquisitionData = [
    { label: 'Cold', count: aiCounts.cold },
    { label: 'Warm', count: aiCounts.warm },
    { label: 'Responded', count: aiCounts.responded },
    { label: 'Acquired', count: aiCounts.acquired },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
        </div>
      </div>
    );
  }

  const hasData = totalLeads > 0;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Leads</div>
            <div className="text-3xl font-bold text-black dark:text-white">{totalLeads}</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 p-5">
            <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">❄️ Cold</div>
            <div className="text-3xl font-bold text-blue-600">{cold}</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-900 p-5">
            <div className="text-xs text-orange-500 dark:text-orange-400 uppercase tracking-wide mb-1">🔥 Warm</div>
            <div className="text-3xl font-bold text-orange-500">{warm}</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-900 p-5">
            <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">💬 Responded</div>
            <div className="text-3xl font-bold text-green-600">{responded}</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900 p-5">
            <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">✅ Acquired</div>
            <div className="text-3xl font-bold text-purple-600">{acquired}</div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900 p-5">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">🤖 AI Acquired</div>
            <div className="text-3xl font-bold text-emerald-600">{aiAcquired}</div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold mb-1 text-black dark:text-white">Lead Temperature Overview</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">All leads across cold, warm, responded and acquired stages</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={temperatureData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#6b7280' }} />
                  {temperatureData.map(entry => (
                    <Cell key={entry.label} fill={TEMP_COLORS[entry.label]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold mb-1 text-black dark:text-white">AI Acquisition Funnel</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Leads marked as AI-acquired at each stage</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={aiAcquisitionData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#6b7280' }} />
                  {aiAcquisitionData.map(entry => (
                    <Cell key={entry.label} fill={TEMP_COLORS[entry.label]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No lead data yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add your first lead to see charts and stats here.</p>
          <Button onClick={onNavigateToClients} className="bg-blue-600 hover:bg-blue-700 text-white">
            Add First Lead
          </Button>
        </Card>
      )}

      {/* CTA */}
      {hasData && (
        <div className="bg-gradient-to-r from-black to-gray-900 rounded-lg p-8 text-white text-center border border-gray-800">
          <h3 className="text-xl font-bold mb-2">Manage Your Leads</h3>
          <p className="text-gray-400 mb-4">Track cold, warm, and responded leads — and mark which ones were AI-acquired.</p>
          <Button onClick={onNavigateToClients} className="bg-blue-600 hover:bg-blue-700 text-white">
            View All Leads
          </Button>
        </div>
      )}
    </div>
  );
}
