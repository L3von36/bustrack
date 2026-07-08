'use client';

import React from 'react';
import { LogOut, Sun, Moon, Bus, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import type { Role } from './types';

const ROLE_LABELS: Record<Role, string> = {
  TICKETER: 'Ticketer',
  CASHIER: 'Cashier',
  GATEMAN: 'Gateman',
  MANAGER: 'Station Manager',
  SUPERADMIN: 'Super Admin',
};

interface AppHeaderProps {
  user: { name: string; role: Role };
  onLogout: () => void;
  isConnected?: boolean;
}

export function AppHeader({ user, onLogout, isConnected = false }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card/80 backdrop-blur-md flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Bus className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">BusTrack</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">{ROLE_LABELS[user.role]}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
          <span className="text-xs text-muted-foreground hidden sm:inline">{user.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-8 px-3 text-muted-foreground hover:text-foreground text-xs gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}