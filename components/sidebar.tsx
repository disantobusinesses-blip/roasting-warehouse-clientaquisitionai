'use client';

import Image from 'next/image';
import { LayoutDashboard, Users, Mail, Menu, X } from 'lucide-react';
import { useState } from 'react';

type View = 'dashboard' | 'leads' | 'email-centre';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const navItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as View, label: 'Leads', icon: Users },
  { id: 'email-centre' as View, label: 'Email Centre', icon: Mail },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (view: View) => {
    onViewChange(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/roastinglogo-9liY0x5Ae22I4sWJqPYNDSgCdMB15s.png"
            alt="Roasting Warehouse Logo"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-semibold text-foreground">Roasting Warehouse</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/roastinglogo-9liY0x5Ae22I4sWJqPYNDSgCdMB15s.png"
              alt="Roasting Warehouse Logo"
              width={44}
              height={44}
              className="rounded-full ring-2 ring-gold/30"
            />
            <div>
              <h1 className="font-bold text-foreground leading-tight">Roasting Warehouse</h1>
              <p className="text-xs text-gold">Client Acquisition AI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gold text-primary-foreground shadow-lg shadow-gold/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="px-4 py-3 rounded-lg bg-sidebar-accent">
            <p className="text-xs text-muted-foreground">Powered by</p>
            <p className="text-sm font-semibold text-gold">Roasting Warehouse AI</p>
          </div>
        </div>
      </aside>
    </>
  );
}
