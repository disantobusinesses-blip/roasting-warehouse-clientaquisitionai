'use client';

import { useState } from 'react';
import { useClients } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientsListProps {
  onSelectClient: (clientId: string) => void;
}

export default function ClientsList({ onSelectClient }: ClientsListProps) {
  const { clients, deleteClient, loading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'initial-contact': return 'text-gray-600 dark:text-gray-400';
      case 'discovery': return 'text-blue-600 dark:text-blue-400';
      case 'proposal': return 'text-purple-600 dark:text-purple-400';
      case 'negotiation': return 'text-orange-600 dark:text-orange-400';
      case 'closed': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatStage = (stage: string) => {
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading clients...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black dark:text-white">Clients</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700 text-white">
          {showAddForm ? 'Cancel' : 'Add New Client'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
        <div className="space-y-4">
          <Input
            placeholder="Search clients by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === null ? 'default' : 'outline'}
              onClick={() => setStatusFilter(null)}
              className={statusFilter === null ? 'bg-blue-600 text-white' : 'text-black dark:text-white'}
            >
              All
            </Button>
            {['lead', 'prospect', 'customer', 'inactive'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? 'bg-purple-600 text-white' : 'text-black dark:text-white'}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <Card key={client.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-black dark:text-white">{client.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{client.company}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(client.status)}`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email: {client.email}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Phone: {client.phone}</p>
                <p className={`text-xs font-medium ${getStageColor(client.acquisitionStage)}`}>
                  Stage: {formatStage(client.acquisitionStage)}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-sm font-bold text-black dark:text-white mb-3">Value: <span className="text-purple-600">${client.value.toLocaleString()}</span></p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelectClient(client.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => deleteClient(client.id)}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900 text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No clients found matching your criteria.</p>
        </Card>
      )}
    </div>
  );
}
