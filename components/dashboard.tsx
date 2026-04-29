'use client';

import { useClients } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Flame, MessageSquare, DollarSign, Mail, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, FunnelChart, Funnel,
} from 'recharts';

interface DashboardProps {
  onNavigateToLeads: () => void;
}

const FUNNEL_COLORS = ['#C9A84C', '#A88B3D', '#876E2E', '#66521F', '#4A3C17'];

export default function Dashboard({ onNavigateToLeads }: DashboardProps) {
  const { clients, loading } = useClients();

  const totalLeads = clients.length;
  const cold = clients.filter(c => c.leadTemperature === 'cold').length;
  const warm = clients.filter(c => c.leadTemperature === 'warm').length;
  const responded = clients.filter(c => c.leadTemperature === 'responded').length;
  const acquired = clients.filter(c => c.status === 'customer').length;
  const pipelineValue = clients.reduce((sum, c) => sum + (c.value || 0), 0);
  const emailsSent = clients.filter(c => c.leadTemperature !== 'cold').length; // Simulated

  const funnelData = [
    { name: 'Cold Leads', value: cold, fill: FUNNEL_COLORS[0] },
    { name: 'Warm Leads', value: warm, fill: FUNNEL_COLORS[1] },
    { name: 'Responded', value: responded, fill: FUNNEL_COLORS[2] },
    { name: 'Acquired', value: acquired, fill: FUNNEL_COLORS[3] },
  ].filter(d => d.value > 0);

  const temperatureData = [
    { label: 'Cold', count: cold, fill: '#60A5FA' },
    { label: 'Warm', count: warm, fill: '#F97316' },
    { label: 'Responded', count: responded, fill: '#22C55E' },
    { label: 'Acquired', count: acquired, fill: '#C9A84C' },
  ];

  // Recent activity (simulated from clients)
  const recentActivity = clients.slice(0, 5).map((client, index) => ({
    id: client.id,
    action: index % 3 === 0 ? 'New lead added' : index % 3 === 1 ? 'Status updated' : 'Email sent',
    lead: client.name,
    company: client.company,
    time: `${index + 1}h ago`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-foreground', bgColor: 'bg-secondary' },
    { label: 'Hot Leads', value: warm + responded, icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, icon: DollarSign, color: 'text-gold', bgColor: 'bg-gold/10' },
    { label: 'Emails Sent', value: emailsSent, icon: Mail, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your lead acquisition pipeline</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-card border-border p-5 hover:border-gold/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      {totalLeads > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Funnel */}
          <Card className="bg-card border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-foreground">Pipeline Funnel</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Lead progression through stages</p>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <FunnelChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: 13
                    }}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                    labelLine
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                No data to display
              </div>
            )}
          </Card>

          {/* Lead Temperature Chart */}
          <Card className="bg-card border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-foreground">Lead Distribution</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Leads by temperature status</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={temperatureData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: 13
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#888' }} />
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">No leads yet</p>
          <p className="text-sm text-muted-foreground mb-6">Add your first lead to see charts and analytics.</p>
          <Button 
            onClick={onNavigateToLeads} 
            className="bg-gold hover:bg-gold/90 text-primary-foreground"
          >
            Add First Lead
          </Button>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="bg-card border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="text-gold">{activity.action}</span>
                      {' - '}
                      <span className="font-medium">{activity.lead}</span>
                      {' at '}
                      <span className="text-muted-foreground">{activity.company}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CTA */}
      {totalLeads > 0 && (
        <Card className="bg-gradient-to-r from-gold/20 to-gold/5 border-gold/30 p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Ready to grow your pipeline?</h3>
          <p className="text-muted-foreground mb-4">Manage your leads and send targeted outreach emails.</p>
          <Button 
            onClick={onNavigateToLeads} 
            className="bg-gold hover:bg-gold/90 text-primary-foreground"
          >
            View All Leads
          </Button>
        </Card>
      )}
    </div>
  );
}
