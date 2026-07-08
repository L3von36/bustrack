'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon, Wifi, WifiOff, Bus } from 'lucide-react';
import type { StaffUser, Role } from './types';

interface HeaderProps {
  user: StaffUser;
  onLogout: () => void;
  iconBgColor?: string;
  isConnected?: boolean;
}

const ROLE_HEADER_ICONS: Record<Role, React.ReactNode> = {
  TICKETER: <Bus className="h-4 w-4" />,
  CASHIER: <span className="text-xs font-bold">KES</span>,
  GATEMAN: <Bus className="h-4 w-4" />,
  MANAGER: <span className="text-xs font-bold">M</span>,
  SUPERADMIN: <Bus className="h-4 w-4" />,
};

export function AppHeader({ user, onLogout, iconBgColor = 'bg-primary', isConnected = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${iconBgColor} text-white`}>
          {ROLE_HEADER_ICONS[user.role]}
        </div>
        <span className="font-semibold hidden sm:inline">
          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}: {user.name}
        </span>
        <span className="font-semibold sm:hidden">
          {user.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Connection indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs" title={isConnected ? 'Real-time connected' : 'Real-time disconnected'}>
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        {/* Dark mode toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}