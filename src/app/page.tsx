'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { LoginScreen } from '@/components/bus-track/login-screen';
import { TicketerInterface } from '@/components/bus-track/ticketer-interface';
import { CashierInterface } from '@/components/bus-track/cashier-interface';
import { GatemanInterface } from '@/components/bus-track/gateman-interface';
import { ManagerInterface } from '@/components/bus-track/manager-interface';
import { SuperadminInterface } from '@/components/bus-track/superadmin-interface';
import type { StaffUser } from '@/components/bus-track/types';

export default function Home() {
  const { toast } = useToast();

  const [user, setUser] = useState<StaffUser | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const logout = useCallback(() => {
    setUser(null);
    setLoginEmail('');
    setLoginError('');
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <LoginScreen
          key="login"
          onLogin={setUser}
          loginLoading={loginLoading}
          setLoginLoading={setLoginLoading}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginError={loginError}
          setLoginError={setLoginError}
          toast={toast}
        />
      ) : (
        <div key={user.role}>
          {user.role === 'TICKETER' && (
            <TicketerInterface user={user} onLogout={logout} toast={toast} />
          )}
          {user.role === 'CASHIER' && (
            <CashierInterface user={user} onLogout={logout} toast={toast} />
          )}
          {user.role === 'GATEMAN' && (
            <GatemanInterface user={user} onLogout={logout} toast={toast} />
          )}
          {user.role === 'MANAGER' && (
            <ManagerInterface user={user} onLogout={logout} toast={toast} />
          )}
          {user.role === 'SUPERADMIN' && (
            <SuperadminInterface user={user} onLogout={logout} toast={toast} />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}