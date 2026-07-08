'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bus, ChevronRight, Loader2, Search } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Bus className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">BusTrack</h1>
          <p className="text-muted-foreground mt-2">Bus Station Ticket Booking System</p>
        </div>

        {/* Login Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-1">Sign In</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter your email to access the system</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => handleLogin()} disabled={loginLoading}>
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
              </Button>
            </div>
            {loginError && (
              <p className="text-sm text-destructive mt-2">{loginError}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Demo */}
        <div className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Quick Demo — Click a role to enter
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config], index) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/30"
                  onClick={() => handleLogin(config.email)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted mb-2 ${config.color}`}>
                      {config.icon}
                    </div>
                    <h3 className="font-semibold text-sm">{role.charAt(0) + role.slice(1).toLowerCase()}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight hidden sm:block">{config.desc}</p>
                    <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs gap-1">
                      Enter <ChevronRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}