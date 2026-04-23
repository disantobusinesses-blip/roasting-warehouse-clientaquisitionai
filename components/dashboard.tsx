'use client';

import { useClients } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onNavigateToClients: () => void;
}

export default function Dashboard({ onNavigateToClients }: DashboardProps) {
  const { clients, loading } = useClients();

  const stats = {
    totalClients: clients.length,
    activeCustomers: clients.filter(c => c.status === 'customer').length,
    totalValue: clients.reduce((sum, c) => sum + c.value, 0),
    prospects: clients.filter(c => c.status === 'prospect').length,
  };

  const stageData = [
    { stage: 'Initial Contact', count: clients.filter(c => c.acquisitionStage === 'initial-contact').length },
    { stage: 'Discovery', count: clients.filter(c => c.acquisitionStage === 'discovery').length },
    { stage: 'Proposal', count: clients.filter(c => c.acquisitionStage === 'proposal').length },
    { stage: 'Negotiation', count: clients.filter(c => c.acquisitionStage === 'negotiation').length },
    { stage: 'Closed', count: clients.filter(c => c.acquisitionStage === 'closed').length },
  ];

  const statusData = [
    { status: 'Lead', count: clients.filter(c => c.status === 'lead').length },
    { status: 'Prospect', count: clients.filter(c => c.status === 'prospect').length },
    { status: 'Customer', count: clients.filter(c => c.status === 'customer').length },
    { status: 'Inactive', count: clients.filter(c => c.status === 'inactive').length },
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

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Clients</div>
            <div className="text-3xl font-bold text-black dark:text-white mt-2">{stats.totalClients}</div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Customers</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.activeCustomers}</div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pipeline Value</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">${(stats.totalValue / 1000).toFixed(0)}K</div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Prospects</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{stats.prospects}</div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stage" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Clients by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="status" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-black to-gray-900 rounded-lg p-8 text-white text-center border border-gray-800">
        <h3 className="text-xl font-bold mb-2">Ready to Manage More Clients?</h3>
        <p className="text-gray-400 mb-4">View and manage all your clients from the Clients section</p>
        <Button onClick={onNavigateToClients} className="bg-blue-600 hover:bg-blue-700 text-white">
          View All Clients
        </Button>
      </div>
    </div>
  );
}
