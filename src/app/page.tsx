'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { LoginScreen } from '@/components/bus-track/login-screen';
import type { StaffUser } from '@/components/bus-track/types';

// Dynamic import dashboards — only loaded after login
const TicketerInterface = dynamic(() => import('@/components/bus-track/ticketer-interface').then(m => ({ default: m.TicketerInterface })), { ssr: false });
const CashierInterface = dynamic(() => import('@/components/bus-track/cashier-interface').then(m => ({ default: m.CashierInterface })), { ssr: false });
const GatemanInterface = dynamic(() => import('@/components/bus-track/gateman-interface').then(m => ({ default: m.GatemanInterface })), { ssr: false });
const ManagerInterface = dynamic(() => import('@/components/bus-track/manager-interface').then(m => ({ default: m.ManagerInterface })), { ssr: false });
const SuperadminInterface = dynamic(() => import('@/components/bus-track/superadmin-interface').then(m => ({ default: m.SuperadminInterface })), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load session on mount
  useEffect(() => {
    const saved = localStorage.getItem('bustrack_session');
    if (saved) {
      try {
        const { user: u, token: t } = JSON.parse(saved);
        setUser(u);
        setToken(t);
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = useCallback((userData: StaffUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setLoginEmail('');
    setLoginError('');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bustrack_session');
    toast.success('Logged out');
  }, []);

  // Not logged in → show landing / login
  if (!user || !token) {
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

  // Logged in → show role-based dashboard
  const Dashboard = {
    TICKETER: TicketerInterface,
    CASHIER: CashierInterface,
    GATEMAN: GatemanInterface,
    MANAGER: ManagerInterface,
    SUPERADMIN: SuperadminInterface,
  }[user.role];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {Dashboard ? (
        <Dashboard user={user} onLogout={handleLogout} toast={toast} authToken={token} />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Unknown role: {user.role}
        </div>
      )}
    </div>
  );
}