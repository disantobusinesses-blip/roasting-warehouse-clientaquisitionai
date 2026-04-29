'use client';

import { useState } from 'react';
import { useClients, Client } from '@/context/client-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
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

export default function AddLeadModal({ open, onClose }: AddLeadModalProps) {
  const { addClient } = useClients();
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>(EMPTY_FORM);

  if (!open) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) return;
    
    const newClient: Client = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Add New Lead</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Contact name"
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Company *</label>
              <Input
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company name"
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Phone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Temperature</label>
              <select
                name="leadTemperature"
                value={formData.leadTemperature}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="responded">Responded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Deal Value ($)</label>
              <Input
                name="value"
                type="number"
                value={formData.value || ''}
                onChange={handleChange}
                placeholder="0"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Stage</label>
              <select
                name="acquisitionStage"
                value={formData.acquisitionStage}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="initial-contact">Initial Contact</option>
                <option value="discovery">Discovery</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about this lead..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aiAcquired"
              name="aiAcquired"
              checked={formData.aiAcquired}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border bg-input accent-gold"
            />
            <label htmlFor="aiAcquired" className="text-sm text-muted-foreground">
              AI-acquired lead
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.company.trim()}
              className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground disabled:opacity-50"
            >
              Add Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
