'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Sun, Moon, Bus, Bell } from 'lucide-react';
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

/* ─── Notification data ─────────────────────────────────── */
const NOTIFICATIONS = [
  {
    id: '1',
    text: 'ETB 2,200 payment completed — Dire Dawa route',
    time: '2m ago',
    dotColor: 'bg-emerald-500',
  },
  {
    id: '2',
    text: 'Gate G3: Bus departing in 5 min',
    time: '8m ago',
    dotColor: 'bg-amber-500',
  },
  {
    id: '3',
    text: 'New booking: Seat 3B — Bahir Dar',
    time: '15m ago',
    dotColor: 'bg-blue-500',
  },
];

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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  /* Click outside to close dropdown */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(!notifOpen)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {/* Red dot with count */}
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
              3
            </span>
          </Button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50 animate-bt-scale-in origin-top-right">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>

              {/* Notification items */}
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-1.5 mt-1.5">
                      <span className={`w-2 h-2 rounded-full ${notif.dotColor} shrink-0`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug font-medium">
                        {notif.text}
                      </p>
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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