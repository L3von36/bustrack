'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
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
  { icon: <Zap className="h-4 w-4" />, title: 'Real-time', desc: 'Live seat booking & updates' },
  { icon: <Shield className="h-4 w-4" />, title: 'Gate Scan', desc: 'Instant ticket validation' },
  { icon: <BarChart3 className="h-4 w-4" />, title: 'AI Insights', desc: 'Demand prediction & analytics' },
  { icon: <Bus className="h-4 w-4" />, title: '5 Roles', desc: 'Ticketer, Cashier, Gateman, Manager, Admin' },
];

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
        toast({ title: `Welcome, ${data.user.name}!`, description: `Logged in as ${data.user.role}` });
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
    <div className="min-h-screen flex flex-col">
      {/* ── Dark hero ── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#09090b]">
        {/* Square grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Ambient blue glow */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[900px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(70% 80% at center 100%, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 sm:py-32">
          <motion.div initial="hidden" animate="visible" className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left: Copy ── */}
            <div>
              {/* Eyebrow */}
              <motion.div variants={slideUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] mb-8">
                <div className="btr-dot bg-blue-500" />
                <span className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase">Station Management System</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={slideUp} custom={1}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-white leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                The smartest way to
                <span className="block mt-1 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  run your bus station.
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p variants={slideUp} custom={2} className="mt-6 text-[15px] leading-relaxed text-zinc-500 max-w-md">
                Real-time ticketing, AI-powered insights, and seamless role-based workflows.
                Built for stations that move thousands daily.
              </motion.p>

              {/* Login form */}
              <motion.div variants={slideUp} custom={3} className="mt-8 flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Input
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-10 bg-white/[0.04] border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 rounded-lg"
                  />
                </div>
                <Button
                  onClick={() => handleLogin()}
                  disabled={loginLoading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg btr-press shadow-lg shadow-blue-600/20"
                >
                  {loginLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                  )}
                </Button>
              </motion.div>
              {loginError && (
                <motion.p variants={slideUp} custom={3.5} className="mt-2 text-xs text-red-400">{loginError}</motion.p>
              )}

              {/* Feature pills */}
              <motion.div variants={slideUp} custom={4} className="mt-10 grid grid-cols-2 gap-3">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                    <div className="mt-0.5 text-zinc-500">{f.icon}</div>
                    <div>
                      <div className="text-[13px] font-medium text-zinc-300">{f.title}</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right: Role cards ── */}
            <motion.div variants={slideUp} custom={2} className="hidden lg:block">
              <div className="btr-glass rounded-2xl p-6">
                <p className="btr-label text-zinc-500 mb-4">Quick Demo</p>
                <div className="space-y-2">
                  {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
                    <motion.button
                      key={role}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLogin(config.email)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-colors duration-150 text-left group btr-press"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/15 transition-colors">
                        {ROLE_ICONS[role]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-zinc-300">
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </div>
                        <div className="text-[11px] text-zinc-600 truncate">{config.desc}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Mobile role cards (below hero on small screens) ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:hidden mt-12"
          >
            <p className="btr-label text-zinc-500 mb-4 text-center">Quick Demo</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config], i) => (
                <motion.button
                  key={role}
                  variants={slideUp}
                  custom={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleLogin(config.email)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left btr-press"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10 text-blue-400">
                    {ROLE_ICONS[role]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-zinc-300 truncate">
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Bottom strip ── */}
      <section className="bg-background border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Bus className="h-3 w-3" /> 4 Active Routes</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Zap className="h-3 w-3" /> AI-Powered</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Shield className="h-3 w-3" /> Real-time Validation</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><BarChart3 className="h-3 w-3" /> Smart Analytics</span>
        </div>
      </section>
    </div>
  );
}