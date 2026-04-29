'use client';

import { useState } from 'react';
import { useClients, Client } from '@/context/client-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, Send, FileText, Users, CheckCircle, Search,
  ChevronRight, Sparkles
} from 'lucide-react';

type EmailTemplate = 'initial-outreach' | 'follow-up' | 'tasting-invite' | 'custom';

interface EmailTemplateData {
  id: EmailTemplate;
  name: string;
  subject: string;
  body: string;
  description: string;
}

const EMAIL_TEMPLATES: EmailTemplateData[] = [
  {
    id: 'initial-outreach',
    name: 'Initial Outreach',
    subject: 'Premium Coffee Solutions for {{company}}',
    body: `Hi {{name}},

I hope this message finds you well. I'm reaching out from Roasting Warehouse, where we specialize in providing premium, freshly roasted coffee solutions for businesses like {{company}}.

We've helped numerous companies elevate their coffee experience, and I'd love to explore how we can do the same for you.

Would you be open to a brief call this week to discuss your current coffee setup and how we might enhance it?

Best regards,
Roasting Warehouse Team`,
    description: 'First contact with new leads',
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    subject: 'Following up - Coffee solutions for {{company}}',
    body: `Hi {{name}},

I wanted to follow up on my previous message about premium coffee solutions for {{company}}.

I understand you're busy, but I truly believe we can add value to your business with our:
- Freshly roasted, specialty-grade coffee beans
- Flexible delivery schedules
- Competitive wholesale pricing

Would a quick 15-minute call work for you this week?

Looking forward to hearing from you.

Best,
Roasting Warehouse Team`,
    description: 'Follow up with warm leads',
  },
  {
    id: 'tasting-invite',
    name: 'Tasting Invite',
    subject: 'Exclusive Coffee Tasting Invitation for {{company}}',
    body: `Hi {{name}},

We'd like to invite you and your team at {{company}} to an exclusive coffee tasting session at Roasting Warehouse.

This complimentary experience includes:
- Guided tasting of our signature blends
- Behind-the-scenes look at our roasting process
- Special wholesale pricing discussion

Available slots are limited. Would you be interested in scheduling a visit?

Warm regards,
Roasting Warehouse Team`,
    description: 'Invite leads to visit your roastery',
  },
  {
    id: 'custom',
    name: 'Custom Email',
    subject: '',
    body: '',
    description: 'Write your own email from scratch',
  },
];

export default function EmailCentre() {
  const { clients, updateClient } = useClients();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('initial-outreach');
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [body, setBody] = useState(EMAIL_TEMPLATES[0].body);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const leadsWithEmail = clients.filter(c => c.email && c.email.trim() !== '');
  
  const filteredLeads = leadsWithEmail.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateChange = (templateId: EmailTemplate) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const getPersonalizedContent = (content: string, lead: Client) => {
    return content
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{company\}\}/g, lead.company)
      .replace(/\{\{email\}\}/g, lead.email);
  };

  const handleSend = async () => {
    if (selectedLeads.length === 0) return;
    
    setSending(true);
    
    // Simulate sending emails
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update lead temperatures to warm if they were cold
    selectedLeads.forEach(leadId => {
      const lead = clients.find(c => c.id === leadId);
      if (lead && lead.leadTemperature === 'cold') {
        updateClient(leadId, { leadTemperature: 'warm' });
      }
    });
    
    setSending(false);
    setSent(true);
    
    // Reset after showing success
    setTimeout(() => {
      setSent(false);
      setSelectedLeads([]);
    }, 3000);
  };

  const handleSaveDraft = () => {
    // In a real app, this would save to database
    alert('Draft saved! (In production, this would persist to database)');
  };

  const getTempStyles = (temp: string) => {
    switch (temp) {
      case 'cold': return 'bg-blue-500/20 text-blue-400';
      case 'warm': return 'bg-orange-500/20 text-orange-400';
      case 'responded': return 'bg-green-500/20 text-green-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Email Centre</h1>
        <p className="text-muted-foreground mt-1">Send targeted outreach emails to your leads</p>
      </div>

      {/* Success Message */}
      {sent && (
        <Card className="bg-green-500/10 border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 font-medium">
              Emails sent successfully to {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''}!
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Lead Selector */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" />
                Select Recipients
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedLeads.length} selected
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Select All */}
            {filteredLeads.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="w-full text-left text-sm text-gold hover:text-gold/80 mb-3 transition-colors"
              >
                {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
              </button>
            )}

            {/* Lead List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => handleLeadToggle(lead.id)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all
                      ${selectedLeads.includes(lead.id)
                        ? 'bg-gold/10 border-gold/30'
                        : 'bg-secondary/50 border-border hover:border-gold/30'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTempStyles(lead.leadTemperature)}`}>
                          {lead.leadTemperature}
                        </span>
                        {selectedLeads.includes(lead.id) && (
                          <CheckCircle className="w-4 h-4 text-gold" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {clients.length === 0
                      ? 'No leads yet. Add leads first.'
                      : 'No leads with email addresses found.'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Email Composer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Template Selector */}
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              Email Templates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMAIL_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${selectedTemplate === template.id
                      ? 'bg-gold/10 border-gold/30'
                      : 'bg-secondary/50 border-border hover:border-gold/30'
                    }
                  `}
                >
                  <FileText className={`w-4 h-4 mb-1 ${selectedTemplate === template.id ? 'text-gold' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{template.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Email Composer */}
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-gold" />
              Compose Email
            </h3>

            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{{name}}'}, {'{{company}}'} for personalization
                </p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  placeholder="Write your email..."
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              {/* Preview */}
              {selectedLeads.length > 0 && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Preview (for first selected lead):</p>
                  {(() => {
                    const previewLead = clients.find(c => c.id === selectedLeads[0]);
                    if (!previewLead) return null;
                    return (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">To:</span>{' '}
                          <span className="text-foreground">{previewLead.email}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Subject:</span>{' '}
                          <span className="text-foreground">{getPersonalizedContent(subject, previewLead)}</span>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={selectedLeads.length === 0 || !subject.trim() || !body.trim() || sending}
                  className="bg-gold hover:bg-gold/90 text-primary-foreground gap-2 flex-1 sm:flex-none disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="bg-gold/5 border-gold/20 p-4">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-gold mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Pro Tip</p>
                <p className="text-sm text-muted-foreground">
                  Sending emails will automatically update cold leads to warm status, helping you track engagement in your pipeline.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
