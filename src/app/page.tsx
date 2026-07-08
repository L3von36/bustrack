'use client';

import React, { useState, useCallback } from 'react';
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

  // ── Logged in → show role-based dashboard (each dashboard renders its own header) ──
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
        <Dashboard user={user} onLogout={handleLogout} toast={toast} />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Unknown role: {user.role}
        </div>
      )}
    </div>
  );
}