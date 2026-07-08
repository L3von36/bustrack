'use client';

import React, { useCallback } from 'react';
import {
  Bus, ArrowRight, Zap, Shield, BarChart3, Ticket, CreditCard, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLE_CONFIG } from './constants';
import type { StaffUser, Role } from './types';

interface LoginScreenProps {
  onLogin: (user: StaffUser) => void;
  loginLoading: boolean;
  setLoginLoading: (v: boolean) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  toast: any;
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  TICKETER: <Ticket className="h-4 w-4" />,
  CASHIER: <CreditCard className="h-4 w-4" />,
  GATEMAN: <Shield className="h-4 w-4" />,
  MANAGER: <BarChart3 className="h-4 w-4" />,
  SUPERADMIN: <Settings className="h-4 w-4" />,
};

const FEATURES = [
  { icon: <Zap className="h-4 w-4" />, title: 'Real-time Booking', desc: 'Live seat selection & instant confirmation' },
  { icon: <Shield className="h-4 w-4" />, title: 'Gate Validation', desc: 'Scan tickets with instant verification' },
  { icon: <BarChart3 className="h-4 w-4" />, title: 'Smart Analytics', desc: 'Revenue trends & demand forecasting' },
  { icon: <Bus className="h-4 w-4" />, title: '5 Roles', desc: 'Ticketer, Cashier, Gateman, Manager, Admin' },
];

export function LoginScreen({ onLogin, loginLoading, setLoginLoading, loginEmail, setLoginEmail, loginError, setLoginError, toast }: LoginScreenProps) {
  const handleLogin = useCallback(async (email?: string) => {
    const targetEmail = email || loginEmail;
    if (!targetEmail) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'password' }),
      });
      const data = await res.json();
      if (data.user) {
        onLogin(data.user);
        toast.success(`Welcome, ${data.user.name}! — ${data.user.role}`);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error');
    } finally {
      setLoginLoading(false);
    }
  }, [loginEmail, onLogin, setLoginError, setLoginLoading, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-background" suppressHydrationWarning>
      {/* ── Main Content ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* ── Left Column ── */}
            <div className="animate-bt-slide-up">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-10">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Bus className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight">BusTrack</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] text-foreground">
                The modern way to
                <span className="block mt-1.5 text-primary">manage your bus station.</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-md">
                Real-time ticketing, role-based workflows, and powerful analytics — built for stations that move thousands daily.
              </p>

              {/* Login Form */}
              <div className="mt-8 flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Input
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-11 rounded-xl bg-card border-border text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleLogin()}
                  disabled={loginLoading}
                  className="h-11 px-6 rounded-xl text-sm font-medium"
                >
                  {loginLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  ) : (
                    <>Sign In <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>
                  )}
                </Button>
              </div>
              {loginError && (
                <p className="mt-2.5 text-xs text-destructive font-medium">{loginError}</p>
              )}

              {/* Features */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className={`flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 animate-bt-fade-in delay-${(i + 2) * 100}`}
                  >
                    <div className="mt-0.5 text-primary">{f.icon}</div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{f.title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right Column: Quick Demo ── */}
            <div className="animate-bt-slide-up delay-200">
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Demo</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] text-muted-foreground">Live</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config], i) => (
                    <button
                      key={role}
                      onClick={() => handleLogin(config.email)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-accent transition-colors duration-150 text-left group animate-bt-fade-in delay-${(i + 2) * 100}`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        {ROLE_ICONS[role]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-foreground">
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">{config.desc}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile role grid */}
              <div className="lg:hidden mt-6 grid grid-cols-2 gap-2">
                {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
                  <button
                    key={role}
                    onClick={() => handleLogin(config.email)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/60 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      {ROLE_ICONS[role]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-foreground truncate">
                        {role.charAt(0) + role.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Bus className="h-3 w-3" /> 4 Active Routes</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> AI-Powered</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Real-time</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> Analytics</span>
        </div>
      </footer>
    </div>
  );
}