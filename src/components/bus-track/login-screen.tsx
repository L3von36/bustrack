'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, ChevronRight, Loader2, Search, Zap, Users, Shield, BarChart3, Ticket, CreditCard, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

/* ─── feature highlights ────────────────────────────────────────── */
const FEATURES = [
  { icon: <Zap className="h-5 w-5" />, label: 'Real-time seat booking' },
  { icon: <Users className="h-5 w-5" />, label: 'Multi-role access' },
  { icon: <Shield className="h-5 w-5" />, label: 'Gate validation' },
  { icon: <BarChart3 className="h-5 w-5" />, label: 'AI-powered insights' },
];

/* ─── role icon map for the hero cards (smaller, outline style) ── */
const ROLE_ICONS: Record<Role, React.ReactNode> = {
  TICKETER: <Ticket className="h-5 w-5" />,
  CASHIER: <CreditCard className="h-5 w-5" />,
  GATEMAN: <Shield className="h-5 w-5" />,
  MANAGER: <BarChart3 className="h-5 w-5" />,
  SUPERADMIN: <Settings className="h-5 w-5" />,
};

/* ─── animation variants ────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
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
        toast({ title: email ? `Welcome, ${data.user.name}!` : 'Welcome back!', description: `Logged in as ${data.user.role}` });
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
    <div className="min-h-screen flex flex-col relative">
      {/* ── Dark hero section with square grid background ── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
        {/* graph-paper square grid overlay — omniroute style */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* radial glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-3xl mx-auto px-4 py-16 sm:py-24"
        >
          {/* Logo + headline */}
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-5 shadow-lg shadow-blue-600/25">
              <Bus className="h-8 w-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              BusTrack
            </h1>
            <p className="text-blue-200/60 mt-3 text-lg max-w-md mx-auto">
              Bus Station Ticket Booking System — fast, smart, and built for real operations.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {FEATURES.map((f) => (
              <motion.span
                key={f.label}
                variants={fadeUp}
                custom={1}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs sm:text-sm text-blue-100/80"
              >
                {f.icon}
                {f.label}
              </motion.span>
            ))}
          </motion.div>

          {/* Login card — glass morphism */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="mx-auto max-w-md border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl shadow-black/20">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-white mb-1">Sign In</h2>
                <p className="text-sm text-blue-200/50 mb-4">Enter your email to access the system</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-200/40" />
                    <Input
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="pl-9 bg-white/[0.06] border-white/10 text-white placeholder:text-blue-200/30 focus-visible:ring-blue-500/40"
                    />
                  </div>
                  <Button
                    onClick={() => handleLogin()}
                    disabled={loginLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                  >
                    {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
                  </Button>
                </div>
                {loginError && (
                  <p className="text-sm text-red-400 mt-2">{loginError}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Demo — role cards */}
          <motion.div variants={fadeUp} custom={3} className="mt-12">
            <h2 className="text-xs font-medium text-blue-200/40 uppercase tracking-widest mb-5 text-center">
              Quick Demo — Click a role to enter
            </h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config], index) => (
                <motion.div
                  key={role}
                  variants={fadeUp}
                  custom={index}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card
                    className="cursor-pointer border-white/[0.06] bg-white/[0.04] backdrop-blur-sm hover:border-blue-500/30 hover:bg-white/[0.07] transition-all duration-200 group"
                    onClick={() => handleLogin(config.email)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 mb-2 group-hover:bg-blue-500/20 transition-colors">
                        {ROLE_ICONS[role]}
                      </div>
                      <h3 className="font-semibold text-sm text-white">
                        {role.charAt(0) + role.slice(1).toLowerCase()}
                      </h3>
                      <p className="text-[11px] text-blue-200/40 mt-1 leading-tight hidden sm:block">{config.desc}</p>
                      <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs gap-1 text-blue-300/60 hover:text-blue-200 hover:bg-white/[0.06]">
                        Enter <ChevronRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom fade to light */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ── Light info strip below hero ── */}
      <section className="bg-background border-t border-border py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Bus className="h-3.5 w-3.5" /> 4 Active Routes</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> 5 Staff Members</span>
          <span className="flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" /> 16 Daily Schedules</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> AI-Powered</span>
        </div>
      </section>
    </div>
  );
}