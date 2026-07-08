'use client';

import React from 'react';
import { LogOut, Sun, Moon, Bus } from 'lucide-react';
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

const ROLE_BADGE_STYLES: Record<Role, string> = {
  TICKETER: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  CASHIER: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  GATEMAN: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  MANAGER: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  SUPERADMIN: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
};

const ROLE_AVATAR_STYLES: Record<Role, string> = {
  TICKETER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  CASHIER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  GATEMAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  MANAGER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  SUPERADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface AppHeaderProps {
  user: { name: string; role: Role };
  onLogout: () => void;
  isConnected?: boolean;
}

export function AppHeader({ user, onLogout, isConnected = false }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-border bg-card/80 backdrop-blur-md flex-shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
          <Bus className="h-[18px] w-[18px] text-white" />
        </div>

        {/* Brand name */}
        <span className="font-semibold text-[15px] tracking-tight text-foreground">
          BusTrack
        </span>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-border" />

        {/* Role pill badge */}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none tracking-wide ${ROLE_BADGE_STYLES[user.role]}`}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 mr-1">
          <span
            className={`relative flex h-2 w-2`}
          >
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
          </span>
          <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* User avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${ROLE_AVATAR_STYLES[user.role]}`}
        >
          {getInitials(user.name)}
        </div>

        {/* User name (hidden on small screens) */}
        <span className="text-sm font-medium text-foreground hidden md:block max-w-[140px] truncate">
          {user.name}
        </span>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-8 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-xs gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}