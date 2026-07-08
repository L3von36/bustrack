'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LoginScreen } from '@/components/bus-track/login-screen';
import { AppHeader } from '@/components/bus-track/app-header';
import { TicketerInterface } from '@/components/bus-track/ticketer-interface';
import { CashierInterface } from '@/components/bus-track/cashier-interface';
import { GatemanInterface } from '@/components/bus-track/gateman-interface';
import { ManagerInterface } from '@/components/bus-track/manager-interface';
import { SuperadminInterface } from '@/components/bus-track/superadmin-interface';
import type { StaffUser } from '@/components/bus-track/types';

export default function Home() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = useCallback((userData: StaffUser) => {
    setUser(userData);
    setLoginEmail('');
    setLoginError('');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    toast.success('Logged out');
  }, []);

  // ── Not logged in → show landing / login ──
  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        loginLoading={loginLoading}
        setLoginLoading={setLoginLoading}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginError={loginError}
        setLoginError={setLoginError}
        toast={toast}
      />
    );
  }

  // ── Logged in → show role-based dashboard ──
  const Dashboard = {
    TICKETER: TicketerInterface,
    CASHIER: CashierInterface,
    GATEMAN: GatemanInterface,
    MANAGER: ManagerInterface,
    SUPERADMIN: SuperadminInterface,
  }[user.role];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-hidden">
        {Dashboard ? (
          <Dashboard user={user} onLogout={handleLogout} toast={toast} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unknown role: {user.role}
          </div>
        )}
      </main>
    </div>
  );
}