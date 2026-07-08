'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Car, DoorOpen, Clock, ShieldCheck, Loader2, Check, X, AlertTriangle, QrCode, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import { useTheme } from 'next-themes';
import type { StaffUser, ScheduleItem } from './types';

interface GatemanInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

export function GatemanInterface({ user, onLogout, toast }: GatemanInterfaceProps) {
  const { isConnected, emit, on, joinGate } = useRealtimeSocket();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [reference, setReference] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [boardingInfo, setBoardingInfo] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules/today');
      const data = await res.json();
      const boardingSchedules = (data.schedules || []).filter((s: ScheduleItem) =>
        ['SCHEDULED', 'BOARDING', 'DELAYED'].includes(s.status)
      );
      setSchedules(boardingSchedules);
      if (boardingSchedules.length > 0 && !selectedSchedule) {
        const boarding = boardingSchedules.find((s: ScheduleItem) => s.status === 'BOARDING') || boardingSchedules[0];
        setSelectedSchedule(boarding);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedSchedule]);

  const fetchBoardingInfo = useCallback(async () => {
    if (!selectedSchedule) return;
    try {
      const res = await fetch(`/api/gate/boarding?scheduleId=${selectedSchedule.id}`);
      const data = await res.json();
      setBoardingInfo(data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedSchedule]);

  useEffect(() => { fetchSchedules(); }, []);

  useEffect(() => {
    if (selectedSchedule) {
      fetchBoardingInfo();
      joinGate(selectedSchedule.id);
      const interval = setInterval(fetchBoardingInfo, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSchedule, fetchBoardingInfo, joinGate]);

  // Real-time gate events from other gatemen
  useEffect(() => {
    const off = on('gate:scan-result', (data: { scheduleId: string }) => {
      if (selectedSchedule?.id === data.scheduleId) {
        fetchBoardingInfo();
      }
    });
    return off;
  }, [selectedSchedule, on, fetchBoardingInfo]);

  const handleValidate = async () => {
    if (!reference.trim() || !selectedSchedule) return;
    setValidating(true);
    try {
      const res = await fetch('/api/gate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          scheduleId: selectedSchedule.id,
          staffId: user.id,
        }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.result === 'VALID') {
        toast({ title: 'Valid Ticket', description: `${data.passengerName} — Seat ${data.seatNumber}` });
        fetchBoardingInfo();
        emit('gate:validated', {
          scheduleId: selectedSchedule.id,
          result: data.result,
          passengerName: data.passengerName,
          seatNumber: data.seatNumber,
          reference: reference.trim(),
        });
      }
    } catch {
      setValidationResult({ result: 'INVALID', reason: 'Network error' });
    } finally {
      setValidating(false);
      setReference('');
      inputRef?.focus();
    }
  };

  const resultConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
    VALID: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', icon: <Check className="h-12 w-12 sm:h-16 sm:w-16" />, border: 'border-emerald-300 dark:border-emerald-700' },
    INVALID: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', icon: <X className="h-12 w-12 sm:h-16 sm:w-16" />, border: 'border-red-300 dark:border-red-700' },
    WRONG_GATE: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', icon: <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16" />, border: 'border-amber-300 dark:border-amber-700' },
    ALREADY_BOARDED: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', icon: <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16" />, border: 'border-orange-300 dark:border-orange-700' },
    CANCELLED: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', icon: <X className="h-12 w-12 sm:h-16 sm:w-16" />, border: 'border-gray-300 dark:border-gray-600' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Top - Bus Info */}
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-3 sm:py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20">
              <Bus className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{selectedSchedule?.routeName || 'Select a Bus'}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-90 mt-1">
                {selectedSchedule && (
                  <>
                    <span className="flex items-center gap-1"><Car className="h-3 w-3 sm:h-4 sm:w-4" /> {selectedSchedule.busPlate}</span>
                    <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3 sm:h-4 sm:w-4" /> Gate {selectedSchedule.gateNumber || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-4 sm:w-4" /> {selectedSchedule.departureTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div className="w-2 h-2 rounded-full bg-emerald-400" title="Real-time connected" />
            )}
            {schedules.length > 1 && (
              <Select value={selectedSchedule?.id || ''} onValueChange={(v) => {
                const s = schedules.find(s => s.id === v);
                if (s) { setSelectedSchedule(s); setValidationResult(null); }
              }}>
                <SelectTrigger className="w-36 sm:w-48 bg-white/10 border-white/20 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.routeName} - {s.departureTime}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {mounted && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <span className="text-sm">Light</span> : <span className="text-sm">Dark</span>}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-white hover:bg-white/10 gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Center - Scanner */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-xl">
            <div className="flex gap-2 mb-6">
              <Input
                ref={setInputRef}
                placeholder="Scan or type booking reference..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                className="h-14 sm:h-16 text-lg sm:text-2xl font-mono text-center tracking-widest"
                autoFocus
              />
              <Button
                size="lg"
                className="h-14 sm:h-16 px-6 sm:px-8 text-base sm:text-lg"
                onClick={handleValidate}
                disabled={validating || !reference.trim()}
              >
                {validating ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : (
                  <><ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2" /> <span className="hidden sm:inline">Validate</span></>
                )}
              </Button>
            </div>

            {/* Result Display */}
            <AnimatePresence mode="wait">
              {validationResult && (
                <motion.div
                  key={validationResult.result}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`
                    rounded-2xl border-2 p-6 sm:p-8 text-center ${resultConfig[validationResult.result]?.bg || 'bg-gray-50 dark:bg-gray-800'}
                    ${resultConfig[validationResult.result]?.border || 'border-gray-300'}
                  `}
                >
                  <div className={`flex justify-center mb-4 ${resultConfig[validationResult.result]?.text || ''}`}>
                    {resultConfig[validationResult.result]?.icon}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-bold ${resultConfig[validationResult.result]?.text || ''}`}>
                    {validationResult.result}
                  </h2>
                  {validationResult.result === 'VALID' && (
                    <div className="mt-3 space-y-1">
                      <p className="text-base sm:text-lg font-semibold text-foreground">{validationResult.passengerName}</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">Seat {validationResult.seatNumber}</p>
                      <p className="text-sm text-muted-foreground font-mono">{validationResult.reference}</p>
                    </div>
                  )}
                  {validationResult.reason && validationResult.result !== 'VALID' && (
                    <p className="mt-2 text-sm opacity-80">{validationResult.reason}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!validationResult && (
              <div className="text-center text-muted-foreground mt-8">
                <QrCode className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-20" />
                <p className="text-base sm:text-lg">Waiting for scan...</p>
                <p className="text-sm">Scan a ticket QR code or type the reference manually</p>
              </div>
            )}
          </div>
        </main>

        {/* Right - Boarding Progress */}
        <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l bg-card p-4 overflow-y-auto shrink-0 max-h-48 lg:max-h-none">
          <h3 className="font-semibold text-sm mb-3">Boarding Progress</h3>
          {boardingInfo && (
            <>
              <div className="text-center mb-4">
                <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
                    <circle
                      cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none"
                      className="text-primary"
                      strokeDasharray={`${(boardingInfo.boardedCount / Math.max(boardingInfo.totalActive, 1)) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-lg sm:text-xl font-bold">{boardingInfo.boardedCount}</p>
                    <p className="text-[10px] text-muted-foreground">/{boardingInfo.totalActive}</p>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2">
                  {Math.round((boardingInfo.boardedCount / Math.max(boardingInfo.totalActive, 1)) * 100)}% Boarded
                </p>
              </div>
              <Separator className="my-3" />
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Boarded Passengers</h4>
              <div className="space-y-1.5 max-h-40 lg:max-h-64 overflow-y-auto">
                {boardingInfo.boarded.map((b: any, i: number) => (
                  <div key={b.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{b.passengerName}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{b.seatNumber}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </motion.div>
  );
}