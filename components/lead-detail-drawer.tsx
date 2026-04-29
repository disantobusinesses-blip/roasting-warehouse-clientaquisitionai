'use client';

import { useState, useEffect } from 'react';
import { useClients, Client } from '@/context/client-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Edit2, Mail, Phone, Building, Calendar, DollarSign } from 'lucide-react';

interface LeadDetailDrawerProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({ leadId, open, onClose }: LeadDetailDrawerProps) {
  const { getClientById, updateClient } = useClients();
  const client = leadId ? getClientById(leadId) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    if (client) {
      setFormData(client);
    }
    setIsEditing(false);
  }, [client]);

  if (!open || !client) return null;

  const handleChange = (
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

  const handleSave = () => {
    if (leadId && formData) {
      updateClient(leadId, formData);
      setIsEditing(false);
    }
  };

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

  const formatStage = (stage: string) =>
    stage.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-card border-l border-border
          transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-card">
          <h2 className="text-xl font-semibold text-foreground">Lead Details</h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-gold hover:bg-gold/90 text-primary-foreground gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormData(client);
                    setIsEditing(false);
                  }}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-border text-foreground gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name & Company */}
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Name</label>
                  <Input
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Company</label>
                  <Input
                    name="company"
                    value={formData.company || ''}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-foreground">{client.name}</h3>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Building className="w-4 h-4" />
                  {client.company}
                </p>
              </>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <select
                  name="status"
                  value={formData.status || 'lead'}
                  onChange={handleChange}
                  className={`appearance-none px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer ${getStatusStyles(formData.status || 'lead')}`}
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  name="leadTemperature"
                  value={formData.leadTemperature || 'cold'}
                  onChange={handleChange}
                  className={`appearance-none px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer ${getTempStyles(formData.leadTemperature || 'cold')}`}
                >
                  <option value="cold">Cold</option>
                  <option value="warm">Warm</option>
                  <option value="responded">Responded</option>
                </select>
              </>
            ) : (
              <>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusStyles(client.status)}`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getTempStyles(client.leadTemperature)}`}>
                  {client.leadTemperature.charAt(0).toUpperCase() + client.leadTemperature.slice(1)}
                </span>
                {client.aiAcquired && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                    AI Acquired
                  </span>
                )}
              </>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
            <h4 className="text-sm font-medium text-foreground mb-3">Contact Information</h4>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Phone</label>
                  <Input
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{client.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{client.phone || 'No phone'}</span>
                </div>
              </>
            )}
          </div>

          {/* Pipeline Info */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
            <h4 className="text-sm font-medium text-foreground mb-3">Pipeline</h4>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Stage</label>
                  <select
                    name="acquisitionStage"
                    value={formData.acquisitionStage || 'initial-contact'}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                  >
                    <option value="initial-contact">Initial Contact</option>
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Deal Value</label>
                  <Input
                    name="value"
                    type="number"
                    value={formData.value || ''}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="text-foreground font-medium">{formatStage(client.acquisitionStage)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deal Value</span>
                  <span className="text-gold font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {client.value > 0 ? client.value.toLocaleString() : '0'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* AI Acquired Toggle (Edit mode) */}
          {isEditing && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/50">
              <input
                type="checkbox"
                id="aiAcquired"
                name="aiAcquired"
                checked={formData.aiAcquired || false}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border bg-input accent-gold"
              />
              <label htmlFor="aiAcquired" className="text-sm text-foreground">
                AI-acquired lead
              </label>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Notes</h4>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Add notes about this lead..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground p-4 rounded-lg bg-secondary/50">
                {client.notes || 'No notes added'}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">Timeline</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Added on {new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
