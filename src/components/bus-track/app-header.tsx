'use client';

import React from 'react';
import { LogOut, Sun, Moon, Wifi, WifiOff, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import type { Role } from './types';

const ROLE_HEADER: Record<Role, { icon: React.ReactNode; label: string }> = {
  TICKETER: { icon: <Bus className="h-4 w-4" />, label: 'Ticketer' },
  CASHIER: { icon: <Bus className="h-4 w-4" />, label: 'Cashier' },
  GATEMAN: { icon: <Bus className="h-4 w-4" />, label: 'Gateman' },
  MANAGER: { icon: <Bus className="h-4 w-4" />, label: 'Station Manager' },
  SUPERADMIN: { icon: <Bus className="h-4 w-4" />, label: 'Super Admin' },
};

interface AppHeaderProps {
  user: { name: string; role: Role };
  onLogout: () => void;
  isConnected?: boolean;
}

export function AppHeader({ user, onLogout, isConnected = false }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const roleInfo = ROLE_HEADER[user.role];

  return (
    <header className="h-[52px] flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: Logo + Role */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Bus className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight hidden sm:block">BusTrack</span>
        </div>
        <div className="h-4 w-px bg-border hidden sm:block" />
        <span className="text-[12px] text-muted-foreground font-medium hidden sm:block">{roleInfo.label}</span>
        <div className="flex items-center gap-1.5 ml-1">
          <div className={`btr-dot ${isConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
          <span className="text-[11px] text-muted-foreground hidden md:block">{user.name}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-8 px-2.5 text-muted-foreground hover:text-foreground text-xs gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}