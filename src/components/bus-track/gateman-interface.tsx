'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ScanLine,
  Users,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import { AppHeader } from './app-header';
import { STATUS_COLORS } from './constants';
import type { StaffUser, ScheduleItem } from './types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface GatemanInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

/* ------------------------------------------------------------------ */
/*  Validation result type                                              */
/* ------------------------------------------------------------------ */

type ValidationResult = {
  result: 'VALID' | 'INVALID' | 'WRONG_GATE' | 'ALREADY_BOARDED' | 'CANCELLED';
  passengerName?: string;
  seatNumber?: string;
  routeName?: string;
  reason?: string;
  reference?: string;
};

/* ------------------------------------------------------------------ */
/*  SVG Progress Ring                                                  */
/* ------------------------------------------------------------------ */

function ProgressRing({
  value,
  size = 100,
  strokeWidth = 5,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 1));
  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="text-emerald-500 transition-all duration-700 ease-out" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Validation Result Display                                           */
/* ------------------------------------------------------------------ */

function ValidationDisplay({ result }: { result: ValidationResult }) {
  const { result: status } = result;

  /* ── VALID ── */
  if (status === 'VALID') {
    return (
      <div className="animate-bt-scale-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <Check className="h-10 w-10 text-emerald-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="animate-bt-slide-up text-center space-y-2">
          <span className="block text-sm font-bold tracking-widest uppercase text-emerald-500">
            Valid
          </span>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {result.passengerName}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {result.routeName}
          </p>
          <Badge className="mt-2 font-mono text-sm px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15">
            Seat {result.seatNumber}
          </Badge>
        </div>
      </div>
    );
  }

  /* ── INVALID ── */
  if (status === 'INVALID') {
    return (
      <div className="animate-bt-scale-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <X className="h-10 w-10 text-red-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="animate-bt-slide-up text-center space-y-2">
          <span className="block text-sm font-bold tracking-widest uppercase text-red-500">
            Invalid
          </span>
          <p className="text-sm text-muted-foreground max-w-xs">
            {result.reason || 'This booking reference could not be verified.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── CANCELLED ── */
  if (status === 'CANCELLED') {
    return (
      <div className="animate-bt-scale-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <X className="h-10 w-10 text-red-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="animate-bt-slide-up text-center space-y-2">
          <span className="block text-sm font-bold tracking-widest uppercase text-red-500">
            Cancelled
          </span>
          <p className="text-sm text-muted-foreground max-w-xs">
            {result.reason || 'This booking has been cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── WRONG_GATE ── */
  if (status === 'WRONG_GATE') {
    return (
      <div className="animate-bt-scale-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="animate-bt-slide-up text-center space-y-2">
          <span className="block text-sm font-bold tracking-widest uppercase text-amber-500">
            Wrong Gate
          </span>
          <p className="text-sm text-muted-foreground max-w-xs">
            {result.reason || 'This ticket is assigned to a different gate. Please direct the passenger to the correct gate.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── ALREADY_BOARDED ── */
  if (status === 'ALREADY_BOARDED') {
    return (
      <div className="animate-bt-scale-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="animate-bt-slide-up text-center space-y-2">
          <span className="block text-sm font-bold tracking-widest uppercase text-amber-500">
            Already Boarded
          </span>
          <p className="text-sm text-muted-foreground max-w-xs">
            {result.reason || 'This passenger has already boarded the vehicle.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GatemanInterface({ user, onLogout, toast }: GatemanInterfaceProps) {
  const { isConnected, emit, on, joinGate } = useRealtimeSocket();

  /* ---- state ---- */
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [reference, setReference] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [boardingInfo, setBoardingInfo] = useState<{
    boardedCount: number;
    totalActive: number;
    boarded: { id: string; passengerName: string; seatNumber: string }[];
  } | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [manifestOpen, setManifestOpen] = useState(false);

  /* ---- data fetching ---- */
  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
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
    } finally {
      setLoadingSchedules(false);
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
    setValidationResult(null);
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
      setValidationResult({ result: 'INVALID', reason: 'Network error. Please try again.' });
    } finally {
      setValidating(false);
      setReference('');
      inputRef.current?.focus();
    }
  };

  /* ---- derived ---- */
  const boardingCount = boardingInfo?.boardedCount ?? 0;
  const boardingTotal = boardingInfo?.totalActive ?? 1;
  const boardingPct = Math.round((boardingCount / Math.max(boardingTotal, 1)) * 100);
  const progressValue = boardingCount / Math.max(boardingTotal, 1);
  const remainingCount = Math.max(boardingTotal - boardingCount, 0);

  /* ─── Fake manifest data ──────────────────────────────────── */
  const FAKE_MANIFEST = [
    { name: 'Abebe Kebede', seat: '1A', boarded: true },
    { name: 'Tigist Haile', seat: '1B', boarded: true },
    { name: 'Yohannes Tadesse', seat: '2A', boarded: true },
    { name: 'Selamawit Girma', seat: '2B', boarded: false },
    { name: 'Dawit Assefa', seat: '3A', boarded: true },
    { name: 'Hanna Belay', seat: '3B', boarded: false },
    { name: 'Fikadu Mekonnen', seat: '4A', boarded: true },
    { name: 'Meron Tesfaye', seat: '4B', boarded: true },
    { name: 'Bereket Wondimu', seat: '5A', boarded: false },
    { name: 'Nardos Alemu', seat: '5B', boarded: true },
    { name: 'Solomon Worku', seat: '6A', boarded: false },
    { name: 'Feven Tadesse', seat: '6B', boarded: true },
    { name: 'Natnael Ashenafi', seat: '7A', boarded: true },
    { name: 'Liya Gebremeskel', seat: '7B', boarded: false },
    { name: 'Ephrem Bekele', seat: '8A', boarded: true },
    { name: 'Ruth Teshome', seat: '8B', boarded: false },
    { name: 'Abel Zewde', seat: '9A', boarded: true },
    { name: 'Sara Hailu', seat: '9B', boarded: true },
    { name: 'Teshome Desta', seat: '10A', boarded: false },
    { name: 'Mekdes Alemayehu', seat: '10B', boarded: false },
  ];
  const manifestBoardedCount = FAKE_MANIFEST.filter((p) => p.boarded).length;
  const manifestTotal = FAKE_MANIFEST.length;

  /* ================================================================ */
  return (
    <div className="h-full flex flex-col bg-background">
      {/* ── Header ── */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* ── Body ── */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bt-scroll">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── TOP BAR: Schedule Info Strip ──                       */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="animate-bt-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 bg-card border border-border/60 rounded-xl px-4 py-3 sm:py-0">

                {/* Left: Schedule Selector */}
                <div className="flex items-center gap-3 sm:border-r sm:border-border/40 sm:pr-4 sm:py-3">
                  <ScanLine className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {loadingSchedules ? (
                    <Skeleton className="h-8 w-56 rounded-md" />
                  ) : (
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
                      <SelectTrigger className="w-full sm:w-60 h-8 text-[13px] font-mono border-border/40 bg-background/50 hover:bg-background transition-colors">
                        <SelectValue placeholder="Select schedule…" />
                      </SelectTrigger>
                      <SelectContent>
                        {schedules.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-[13px] font-mono">
                            <span className="flex items-center gap-2">
                              {s.routeName} — {s.departureTime}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Right: Schedule Details (only shown when schedule is selected) */}
                {selectedSchedule && !loadingSchedules && (
                  <div className="flex items-center gap-4 sm:gap-5 sm:ml-auto sm:py-3 flex-wrap">
                    {/* Bus Plate */}
                    <div className="flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-mono font-medium text-foreground">
                        {selectedSchedule.busPlate}
                      </span>
                    </div>

                    {/* Gate Number */}
                    <div className="flex items-center gap-1.5">
                      <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-foreground">
                        Gate {selectedSchedule.gateNumber || 'TBD'}
                      </span>
                    </div>

                    {/* Departure Time */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-mono text-foreground">
                        {selectedSchedule.departureTime}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {selectedSchedule.status && (
                      <Badge
                        variant="secondary"
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold border-0 ${STATUS_COLORS[selectedSchedule.status] || ''}`}
                      >
                        {selectedSchedule.status}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Empty state for right side when no schedule */}
                {!selectedSchedule && !loadingSchedules && (
                  <div className="sm:ml-auto sm:py-3">
                    <span className="text-[13px] text-muted-foreground">
                      Select a schedule to begin
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── MAIN AREA: Scan Zone + Boarding Progress ──            */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 flex-1 min-h-0">

              {/* ────────────────────────────────────────────────────── */}
              {/* ─── LEFT PANEL (60%): Scan Zone ───                    */}
              {/* ────────────────────────────────────────────────────── */}
              <div className="lg:col-span-3 animate-bt-slide-up delay-100">
                <div
                  className="relative border border-border/60 rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: selectedSchedule
                      ? 'radial-gradient(ellipse at center 30%, rgba(16,185,129,0.03) 0%, transparent 60%)'
                      : undefined,
                  }}
                >
                  {/* Panel Header */}
                  <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">Scan Zone</h2>
                      <p className="text-[11px] text-muted-foreground">
                        Enter or scan a booking reference
                      </p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  {/* Scan Input Row */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          ref={inputRef}
                          placeholder="Type or scan reference…"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                          className="h-16 text-2xl font-mono tracking-widest text-center bg-background border-border/60 focus:border-emerald-500/50 focus:ring-emerald-500/10 placeholder:text-muted-foreground/30 placeholder:text-lg placeholder:tracking-normal placeholder:font-sans"
                          autoFocus
                          disabled={validating || !selectedSchedule}
                        />
                        {!reference && !validating && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ScanLine className="h-5 w-5 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <Button
                        className="h-16 w-20 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-150 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-40 disabled:hover:shadow-none"
                        onClick={handleValidate}
                        disabled={validating || !reference.trim() || !selectedSchedule}
                      >
                        {validating ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-7 w-7" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Validation Result Area */}
                  <div className="flex-1 px-5 pb-5 flex items-center justify-center" style={{ minHeight: 250 }}>
                    {validating ? (
                      <div className="animate-bt-fade-in flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <span className="text-sm text-muted-foreground">Validating ticket…</span>
                      </div>
                    ) : validationResult ? (
                      <ValidationDisplay result={validationResult} />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground/20 select-none">
                        <Bus className="h-16 w-16" strokeWidth={1} />
                        <span className="text-sm font-medium">Waiting for scan…</span>
                        <span className="text-[12px]">Scan a booking reference to validate</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────── */}
              {/* ─── RIGHT PANEL (40%): Boarding Progress ───           */}
              {/* ────────────────────────────────────────────────────── */}
              <div className="lg:col-span-2 animate-bt-slide-up delay-200">
                <div className="border border-border/60 bg-card rounded-2xl flex flex-col h-full min-h-[480px] lg:min-h-0">

                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold tracking-tight">Boarding Progress</h2>
                        <p className="text-[11px] text-muted-foreground">
                          Real-time passenger status
                        </p>
                      </div>
                    </div>
                    {boardingInfo && (
                      <Badge variant="outline" className="font-mono text-[11px] h-6 px-2 border-border/60 text-muted-foreground">
                        {boardingCount}/{boardingTotal}
                      </Badge>
                    )}
                  </div>

                  <Separator className="opacity-50" />

                  {/* Content */}
                  {!selectedSchedule ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-[13px] text-muted-foreground">
                        Select a schedule to view boarding progress
                      </p>
                    </div>
                  ) : !boardingInfo ? (
                    <div className="flex-1 px-5 py-4 flex flex-col gap-4">
                      <div className="flex flex-col items-center gap-3">
                        <Skeleton className="h-[120px] w-[120px] rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Separator className="my-1" />
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Progress Ring Section */}
                      <div className="flex flex-col items-center pt-5 pb-4">
                        <div className="relative flex items-center justify-center">
                          <ProgressRing value={progressValue} size={120} strokeWidth={6} />
                          <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-bold tracking-tight text-foreground leading-none tabular-nums">
                              {boardingCount}
                            </span>
                            <span className="text-[13px] text-muted-foreground mt-1 font-mono tabular-nums">
                              of {boardingTotal}
                            </span>
                          </div>
                        </div>

                        {/* View Manifest button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 h-8 text-xs font-semibold rounded-lg border-border/60 hover:bg-muted/60 gap-1.5"
                          onClick={() => setManifestOpen(true)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          View Manifest
                        </Button>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 mt-4 text-[12px] text-muted-foreground">
                          <span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{boardingPct}%</span>{' '}
                            boarded
                          </span>
                          <span className="text-border">|</span>
                          <span>
                            <span className="font-semibold text-foreground tabular-nums">{remainingCount}</span>{' '}
                            remaining
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="px-5">
                        <div className="h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                            style={{ width: `${boardingPct}%` }}
                          />
                        </div>
                      </div>

                      <Separator className="my-4 opacity-50" />

                      {/* Passengers List */}
                      <div className="flex items-center justify-between px-5 mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Passengers
                        </span>
                      </div>

                      <div className="flex-1 max-h-[280px] lg:max-h-96 overflow-y-auto bt-scroll px-3 pb-4">
                        {boardingInfo.boarded?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {boardingInfo.boarded.map((b, i) => (
                              <div
                                key={b.id}
                                className="animate-bt-fade-in flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                                style={{ animationDelay: `${i * 30}ms` }}
                              >
                                <span className="text-[11px] text-muted-foreground/60 font-mono w-5 text-right tabular-nums flex-shrink-0">
                                  {i + 1}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="flex-1 text-[13px] text-foreground truncate font-medium">
                                  {b.passengerName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[11px] h-6 min-w-[42px] justify-center px-2 border-border/60 text-muted-foreground group-hover:border-emerald-500/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                                >
                                  {b.seatNumber}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                              <Users className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                            <p className="text-[13px] text-muted-foreground/50 font-medium">
                              No passengers boarded yet
                            </p>
                            <p className="text-[11px] text-muted-foreground/30 mt-1">
                              Validated tickets will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ─── Passenger Manifest Sheet ─────────────────────────── */}
      <Sheet open={manifestOpen} onOpenChange={setManifestOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="text-base font-bold text-foreground">
              Passenger Manifest
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground font-normal">
              {selectedSchedule
                ? `${selectedSchedule.routeName} — ${selectedSchedule.departureTime}`
                : 'Boarding manifest'}
            </SheetDescription>
          </SheetHeader>

          {/* Boarded count banner */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {manifestBoardedCount} of {manifestTotal} passengers boarded
              </span>
            </div>
          </div>

          <Separator />

          {/* Manifest table */}
          <div className="flex-1 overflow-y-auto bt-scroll">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border/60">
                  <th className="text-left py-2.5 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-center py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">
                    Seat
                  </th>
                  <th className="text-center py-2.5 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {FAKE_MANIFEST.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 px-6 text-muted-foreground/60 font-mono text-[11px] tabular-nums">
                      {i + 1}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-foreground">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[12px] text-muted-foreground font-medium">
                      {p.seat}
                    </td>
                    <td className="py-2.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.boarded ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                        <span className={`text-[11px] font-semibold ${p.boarded ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {p.boarded ? 'Boarded' : 'Not Boarded'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}