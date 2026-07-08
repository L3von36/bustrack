'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Car,
  DoorOpen,
  Clock,
  ShieldCheck,
  Loader2,
  Check,
  X,
  AlertTriangle,
  QrCode,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import { useTheme } from 'next-themes';
import type { StaffUser, ScheduleItem } from './types';
import { AppHeader } from './app-header';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface GatemanInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

/* ------------------------------------------------------------------ */
/*  Result visual config                                               */
/* ------------------------------------------------------------------ */

type ResultKey = 'VALID' | 'INVALID' | 'WRONG_GATE' | 'ALREADY_BOARDED' | 'CANCELLED';

const RESULT_CONFIG: Record<
  ResultKey,
  { color: string; icon: React.ReactNode; label: string }
> = {
  VALID: {
    color: 'text-emerald-500',
    icon: <Check className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.5} />,
    label: 'Valid',
  },
  INVALID: {
    color: 'text-red-500',
    icon: <X className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.5} />,
    label: 'Invalid',
  },
  WRONG_GATE: {
    color: 'text-amber-500',
    icon: <AlertTriangle className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.5} />,
    label: 'Wrong Gate',
  },
  ALREADY_BOARDED: {
    color: 'text-orange-500',
    icon: <AlertTriangle className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.5} />,
    label: 'Already Boarded',
  },
  CANCELLED: {
    color: 'text-red-500',
    icon: <X className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={2.5} />,
    label: 'Cancelled',
  },
};

/* ------------------------------------------------------------------ */
/*  SVG Progress Ring                                                  */
/* ------------------------------------------------------------------ */

function ProgressRing({
  value,
  size = 100,
  strokeWidth = 5,
}: {
  value: number; // 0-1
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 1));

  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-emerald-500 transition-all duration-700 ease-out"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GatemanInterface({ user, onLogout, toast }: GatemanInterfaceProps) {
  const { isConnected, emit, on, joinGate } = useRealtimeSocket();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  /* ---- state ---- */
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [reference, setReference] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [boardingInfo, setBoardingInfo] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ---- data fetching ---- */
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules/today');
      const data = await res.json();
      const boardingSchedules = (data.schedules || []).filter((s: ScheduleItem) =>
        ['SCHEDULED', 'BOARDING', 'DELAYED'].includes(s.status),
      );
      setSchedules(boardingSchedules);
      if (boardingSchedules.length > 0 && !selectedSchedule) {
        const pick =
          boardingSchedules.find((s: ScheduleItem) => s.status === 'BOARDING') ??
          boardingSchedules[0];
        setSelectedSchedule(pick);
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

  /* ---- effects ---- */
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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

  /* ---- actions ---- */
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
        toast.success(`${data.passengerName} — Seat ${data.seatNumber}`);
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
      inputRef.current?.focus();
    }
  };

  /* ---- derived ---- */
  const config = validationResult
    ? RESULT_CONFIG[validationResult.result as ResultKey]
    : null;

  const boardingCount = boardingInfo?.boardedCount ?? 0;
  const boardingTotal = boardingInfo?.totalActive ?? 1;
  const boardingPct = Math.round((boardingCount / Math.max(boardingTotal, 1)) * 100);
  const progressValue = boardingCount / Math.max(boardingTotal, 1);

  /* ================================================================ */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* ── Header ── */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto btr-scroll">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
          {/* ── Schedule Selector ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="btr-label text-muted-foreground">Schedule</span>
            <Select
              value={selectedSchedule?.id ?? ''}
              onValueChange={(v) => {
                const s = schedules.find((x) => x.id === v);
                if (s) {
                  setSelectedSchedule(s);
                  setValidationResult(null);
                }
              }}
            >
              <SelectTrigger className="w-64 h-9 text-[13px] font-mono bg-card border-border">
                <SelectValue placeholder="Select schedule…" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-[13px] font-mono">
                    {s.routeName} — {s.departureTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSchedule && (
              <div className="hidden sm:flex items-center gap-4 ml-2 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {selectedSchedule.busPlate}
                </span>
                <span className="flex items-center gap-1">
                  <DoorOpen className="h-3 w-3" />
                  Gate {selectedSchedule.gateNumber || 'TBD'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedSchedule.departureTime}
                </span>
              </div>
            )}
          </div>

          {/* ── Two-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* ─── Left: Scan Ticket (3 cols) ─── */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="btr-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span className="btr-label text-muted-foreground">Scan Ticket</span>
                </div>

                {/* Input row */}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type or scan reference…"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                    className="h-12 text-lg font-mono tracking-widest text-center flex-1 bg-background border-border"
                    autoFocus
                    disabled={validating}
                  />
                  <Button
                    className="btr-press h-12 px-6"
                    onClick={handleValidate}
                    disabled={validating || !reference.trim()}
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span className="ml-2 text-[13px] font-medium hidden sm:inline">Validate</span>
                  </Button>
                </div>

                {/* Animated result */}
                <div className="mt-4 min-h-[120px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {validationResult && config && (
                      <motion.div
                        key={validationResult.result + (validationResult.reference ?? '')}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="flex flex-col items-center gap-3 w-full"
                      >
                        {/* Icon */}
                        <div className={`${config.color}`}>{config.icon}</div>

                        {/* Status label */}
                        <span
                          className={`text-sm font-semibold tracking-wide ${config.color}`}
                        >
                          {config.label.toUpperCase()}
                        </span>

                        {/* Passenger details (valid only) */}
                        {validationResult.result === 'VALID' && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.2 }}
                            className="text-center space-y-1"
                          >
                            <p className="text-foreground font-medium text-base">
                              {validationResult.passengerName}
                            </p>
                            <p className="text-muted-foreground text-[13px] font-mono">
                              {validationResult.routeName}
                            </p>
                            <Badge
                              variant="secondary"
                              className="mt-1 font-mono text-[12px]"
                            >
                              Seat {validationResult.seatNumber}
                            </Badge>
                          </motion.div>
                        )}

                        {/* Reason (non-valid) */}
                        {validationResult.result !== 'VALID' && validationResult.reason && (
                          <p className="text-[12px] text-muted-foreground">
                            {validationResult.reason}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty state */}
                  {!validationResult && !validating && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 select-none">
                      <Bus className="h-8 w-8" />
                      <span className="text-[12px]">Waiting for scan…</span>
                    </div>
                  )}

                  {/* Loading state */}
                  {validating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2 text-muted-foreground"
                    >
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-[12px]">Validating…</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Right: Boarding (2 cols) ─── */}
            <div className="lg:col-span-2">
              <div className="btr-card p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="btr-label text-muted-foreground">Boarding</span>
                </div>

                {!boardingInfo ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                    <Separator className="my-2" />
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-md" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Progress ring + count */}
                    <div className="flex flex-col items-center mb-5">
                      <div className="relative flex items-center justify-center">
                        <ProgressRing value={progressValue} size={88} strokeWidth={5} />
                        <div className="absolute flex flex-col items-center">
                          <span className="btr-kpi text-foreground leading-none">
                            {boardingCount}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            /{boardingTotal}
                          </span>
                        </div>
                      </div>
                      <span className="text-[12px] text-muted-foreground mt-2">
                        {boardingPct}% boarded
                      </span>
                    </div>

                    {/* Progress bar (compact) */}
                    <div className="h-1 rounded-full bg-border mb-4 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${boardingPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>

                    <Separator className="mb-4" />

                    {/* Boarded list */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="btr-label text-muted-foreground">Passengers</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {boardingCount} of {boardingTotal}
                      </span>
                    </div>

                    <div className="flex-1 max-h-72 overflow-y-auto btr-scroll pr-1">
                      {boardingInfo.boarded?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {boardingInfo.boarded.map((b: any, i: number) => (
                            <div
                              key={b.id}
                              className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-muted/40 transition-colors"
                            >
                              <span className="text-[11px] text-muted-foreground font-mono w-4 text-right tabular-nums">
                                {i + 1}
                              </span>
                              <span className="flex-1 text-[13px] text-foreground truncate">
                                {b.passengerName}
                              </span>
                              <Badge
                                variant="outline"
                                className="font-mono text-[11px] h-5 px-1.5 border-border"
                              >
                                {b.seatNumber}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground/60 text-center py-6">
                          No passengers boarded yet
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}