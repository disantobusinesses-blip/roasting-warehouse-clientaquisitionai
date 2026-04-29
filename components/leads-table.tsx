'use client';

import { useState } from 'react';
import { useClients, Client } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ChevronDown, Trash2, Eye } from 'lucide-react';
import AddLeadModal from '@/components/add-lead-modal';

interface LeadsTableProps {
  onSelectLead: (leadId: string) => void;
}

type StatusFilter = 'all' | 'lead' | 'prospect' | 'customer' | 'inactive';
type TempFilter = 'all' | 'cold' | 'warm' | 'responded';

export default function LeadsTable({ onSelectLead }: LeadsTableProps) {
  const { clients, updateClient, deleteClient, loading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tempFilter, setTempFilter] = useState<TempFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesTemp = tempFilter === 'all' || client.leadTemperature === tempFilter;
    return matchesSearch && matchesStatus && matchesTemp;
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'prospect': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'lead': return 'bg-gold/20 text-gold border-gold/30';
      case 'inactive': return 'bg-secondary text-muted-foreground border-border';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getTempStyles = (temp: string) => {
    switch (temp) {
      case 'cold': return 'bg-blue-500/20 text-blue-400';
      case 'warm': return 'bg-orange-500/20 text-orange-400';
      case 'responded': return 'bg-green-500/20 text-green-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const handleStatusChange = (clientId: string, newStatus: Client['status']) => {
    updateClient(clientId, { status: newStatus });
  };

  const handleTempChange = (clientId: string, newTemp: Client['leadTemperature']) => {
    updateClient(clientId, { leadTemperature: newTemp });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Manage and track your sales pipeline</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gold hover:bg-gold/90 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none bg-input border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="all">All</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Temperature Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Temp:</span>
            <div className="relative">
              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value as TempFilter)}
                className="appearance-none bg-input border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="all">All</option>
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="responded">Responded</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredClients.length} of {clients.length} leads
      </p>

      {/* Table - Desktop */}
      <div className="hidden lg:block">
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Company</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Temperature</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Value</th>
                  <th className="text-right p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-foreground">{client.company}</td>
                    <td className="p-4">
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client.id, e.target.value as Client['status'])}
                        className={`appearance-none px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${getStatusStyles(client.status)}`}
                      >
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={client.leadTemperature}
                        onChange={(e) => handleTempChange(client.id, e.target.value as Client['leadTemperature'])}
                        className={`appearance-none px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${getTempStyles(client.leadTemperature)}`}
                      >
                        <option value="cold">Cold</option>
                        <option value="warm">Warm</option>
                        <option value="responded">Responded</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {client.value > 0 ? (
                        <span className="font-semibold text-gold">${client.value.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectLead(client.id)}
                          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteClient(client.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-card border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.company}</p>
              </div>
              {client.value > 0 && (
                <span className="font-semibold text-gold">${client.value.toLocaleString()}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <select
                value={client.status}
                onChange={(e) => handleStatusChange(client.id, e.target.value as Client['status'])}
                className={`appearance-none px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${getStatusStyles(client.status)}`}
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={client.leadTemperature}
                onChange={(e) => handleTempChange(client.id, e.target.value as Client['leadTemperature'])}
                className={`appearance-none px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${getTempStyles(client.leadTemperature)}`}
              >
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="responded">Responded</option>
              </select>
              {client.aiAcquired && (
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  AI Acquired
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectLead(client.id)}
                className="flex-1 border-border text-foreground hover:bg-secondary"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteClient(client.id)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card className="bg-card border-border p-12 text-center">
          {clients.length === 0 ? (
            <>
              <p className="text-foreground font-medium mb-1">No leads yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add your first lead to get started.</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gold hover:bg-gold/90 text-primary-foreground"
              >
                Add First Lead
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">No leads match your current filters.</p>
          )}
        </Card>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
