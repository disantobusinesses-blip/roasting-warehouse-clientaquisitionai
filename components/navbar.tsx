'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  return (
    <nav className="bg-black text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/roastinglogo-9liY0x5Ae22I4sWJqPYNDSgCdMB15s.png"
              alt="Roasting Warehouse Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold">Roasting Warehouse</h1>
              <p className="text-xs text-gray-400">Client Acquisition AI</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onViewChange('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === 'clients' ? 'default' : 'ghost'}
              onClick={() => onViewChange('clients')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Clients
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          CRM System
        </div>
      </div>
    </nav>
  );
}
