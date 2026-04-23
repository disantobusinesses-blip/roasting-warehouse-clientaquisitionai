'use client';

import { useState } from 'react';
import { useClients } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

export default function ClientDetail({ clientId, onBack }: ClientDetailProps) {
  const { getClientById, updateClient } = useClients();
  const client = getClientById(clientId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(
    client || {
      id: '',
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'lead' as const,
      acquisitionStage: 'initial-contact' as const,
      value: 0,
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    }
  );

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Client not found</p>
        <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white">
          Back to Clients
        </Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseInt(value) : value
    }));
  };

  const handleSave = () => {
    updateClient(clientId, formData);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStage = (stage: string) => {
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-black dark:text-white">{formData.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{formData.company}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                Save Changes
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="text-black dark:text-white">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                Edit Client
              </Button>
              <Button onClick={onBack} variant="outline" className="text-black dark:text-white">
                Back to Clients
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Name</label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-black dark:text-white font-medium">{formData.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                {isEditing ? (
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-black dark:text-white font-medium">{formData.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-black dark:text-white font-medium">{formData.phone}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Company</label>
                {isEditing ? (
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-black dark:text-white font-medium">{formData.company}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Notes</h3>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={5}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white"
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{formData.notes || 'No notes added'}</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Status</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Client Status</label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded ${getStatusColor(formData.status)}`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Pipeline</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Acquisition Stage</label>
                {isEditing ? (
                  <select
                    name="acquisitionStage"
                    value={formData.acquisitionStage}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-black dark:text-white"
                  >
                    <option value="initial-contact">Initial Contact</option>
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <p className="text-black dark:text-white font-medium">{formatStage(formData.acquisitionStage)}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Deal Value</label>
                {isEditing ? (
                  <Input
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-black dark:text-white font-bold text-lg">${formData.value.toLocaleString()}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Timeline</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Added: {new Date(client.createdAt).toLocaleDateString()}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
