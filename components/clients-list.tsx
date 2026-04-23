'use client';

import { useState } from 'react';
import { useClients, Client } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientsListProps {
  onSelectClient: (clientId: string) => void;
}

const EMPTY_FORM: Omit<Client, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'lead',
  acquisitionStage: 'initial-contact',
  leadTemperature: 'cold',
  aiAcquired: false,
  value: 0,
  notes: '',
};

export default function ClientsList({ onSelectClient }: ClientsListProps) {
  const { clients, addClient, deleteClient, loading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>(EMPTY_FORM);

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    const matchesTemp = !tempFilter || client.leadTemperature === tempFilter;
    return matchesSearch && matchesStatus && matchesTemp;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTempBadge = (temp: string) => {
    switch (temp) {
      case 'cold': return { label: '❄️ Cold', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
      case 'warm': return { label: '🔥 Warm', cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' };
      case 'responded': return { label: '💬 Responded', cls: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' };
      default: return { label: temp, cls: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatStage = (stage: string) =>
    stage.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'value' ? Number(value) : value }));
    }
  };

  const handleAddClient = () => {
    if (!formData.name.trim() || !formData.company.trim()) return;
    const newClient: Client = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setFormData(EMPTY_FORM);
    setShowAddForm(false);
  };

  const statusFilters = ['lead', 'prospect', 'customer', 'inactive'];
  const tempFilters = ['cold', 'warm', 'responded'];

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leads...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black dark:text-white">Leads</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {showAddForm ? 'Cancel' : '+ Add Lead'}
        </Button>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <Card className="bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">New Lead</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Contact name"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Company *</label>
              <Input
                name="company"
                value={formData.company}
                onChange={handleFormChange}
                placeholder="Company name"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="email@example.com"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="Phone number"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Lead Temperature</label>
              <select
                name="leadTemperature"
                value={formData.leadTemperature}
                onChange={handleFormChange}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white text-sm"
              >
                <option value="cold">❄️ Cold</option>
                <option value="warm">🔥 Warm</option>
                <option value="responded">💬 Responded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white text-sm"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Acquisition Stage</label>
              <select
                name="acquisitionStage"
                value={formData.acquisitionStage}
                onChange={handleFormChange}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white text-sm"
              >
                <option value="initial-contact">Initial Contact</option>
                <option value="discovery">Discovery</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Deal Value ($)</label>
              <Input
                name="value"
                type="number"
                value={formData.value || ''}
                onChange={handleFormChange}
                placeholder="0"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={2}
                placeholder="Any notes about this lead..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="aiAcquired"
                name="aiAcquired"
                checked={formData.aiAcquired}
                onChange={handleFormChange}
                className="w-4 h-4 accent-emerald-600"
              />
              <label htmlFor="aiAcquired" className="text-sm text-gray-700 dark:text-gray-300">
                🤖 AI-acquired lead
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleAddClient}
              disabled={!formData.name.trim() || !formData.company.trim()}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              Save Lead
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowAddForm(false); setFormData(EMPTY_FORM); }}
              className="text-black dark:text-white"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
        <div className="space-y-3">
          <Input
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Status:</span>
            <button
              onClick={() => setStatusFilter(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${statusFilter === null ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:border-gray-500'}`}
            >
              All
            </button>
            {statusFilters.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? null : s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:border-gray-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Temperature:</span>
            <button
              onClick={() => setTempFilter(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${tempFilter === null ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:border-gray-500'}`}
            >
              All
            </button>
            {tempFilters.map(t => (
              <button
                key={t}
                onClick={() => setTempFilter(t === tempFilter ? null : t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${tempFilter === t ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:border-gray-500'}`}
              >
                {t === 'cold' ? '❄️ Cold' : t === 'warm' ? '🔥 Warm' : '💬 Responded'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Leads count */}
      {clients.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredClients.length} of {clients.length} leads
        </p>
      )}

      {/* Lead Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const tempBadge = getTempBadge(client.leadTemperature);
          return (
            <Card
              key={client.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base text-black dark:text-white truncate">{client.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.company}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(client.status)}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>

                {/* Temperature + AI badge */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tempBadge.cls}`}>
                    {tempBadge.label}
                  </span>
                  {client.aiAcquired && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      🤖 AI Acquired
                    </span>
                  )}
                </div>

                {/* Stage + value */}
                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">{formatStage(client.acquisitionStage)}</span>
                  {client.value > 0 && (
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      ${client.value.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => onSelectClient(client.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => deleteClient(client.id)}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950 text-xs h-8"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          {clients.length === 0 ? (
            <>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">No leads yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click &quot;+ Add Lead&quot; to get started.</p>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No leads match your current filters.</p>
          )}
        </Card>
      )}
    </div>
  );
}
