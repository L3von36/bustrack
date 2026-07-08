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
  QrCode,
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
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* ── Body ── */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bt-scroll">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

            {/* ── Schedule Selector ── */}
            <div className="animate-bt-fade-in flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule</span>
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
                  <SelectTrigger className="w-64 h-9 text-[13px] font-mono border-border/60 bg-card">
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
              </div>

              {selectedSchedule && (
                <div className="hidden sm:flex items-center gap-5 ml-auto text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" />
                    {selectedSchedule.busPlate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5" />
                    Gate {selectedSchedule.gateNumber || 'TBD'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedSchedule.departureTime}
                  </span>
                  {selectedSchedule.status && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border-0 ${STATUS_COLORS[selectedSchedule.status] || ''}`}
                    >
                      {selectedSchedule.status}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* ── Mobile schedule details ── */}
            {selectedSchedule && (
              <div className="sm:hidden flex items-center gap-3 text-[11px] text-muted-foreground animate-bt-fade-in">
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

            {/* ── KPI Strip ── */}
            {selectedSchedule && boardingInfo && (
              <div className="animate-bt-slide-up grid grid-cols-3 gap-3 sm:gap-4">
                <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Boarded</span>
                  <span className="text-3xl font-bold tracking-tight text-foreground">{boardingCount}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">of {boardingTotal} passengers</span>
                </div>
                <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Remaining</span>
                  <span className="text-3xl font-bold tracking-tight text-foreground">{Math.max(boardingTotal - boardingCount, 0)}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">to board</span>
                </div>
                <div className="border border-border/60 bg-card rounded-xl p-4 flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Progress</span>
                  <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{boardingPct}%</span>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                      style={{ width: `${boardingPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
              {/* ─── Left: Scan Ticket (3 cols) ─── */}
              <div className="lg:col-span-3 animate-bt-slide-up delay-100">
                <div className="border border-border/60 bg-card rounded-xl p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">Scan Ticket</h2>
                      <p className="text-[11px] text-muted-foreground">Enter or scan a booking reference to validate</p>
                    </div>
                  </div>

                  {/* Input row */}
                  <div className="flex gap-2.5">
                    <Input
                      ref={inputRef}
                      placeholder="Type or scan reference…"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                      className="h-12 text-lg font-mono tracking-widest text-center flex-1 bg-background border-border/60"
                      autoFocus
                      disabled={validating}
                    />
                    <Button
                      className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
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

                  {/* Result area */}
                  <div className="mt-6 flex-1 min-h-[140px] flex items-center justify-center">
                    {validationResult && config && (
                      <div
                        key={validationResult.result + (validationResult.reference ?? '')}
                        className="animate-bt-scale-in flex flex-col items-center gap-3 w-full"
                      >
                        <div className={`${config.color}`}>{config.icon}</div>
                        <span
                          className={`text-sm font-semibold tracking-wide ${config.color}`}
                        >
                          {config.label.toUpperCase()}
                        </span>

                        {/* Passenger details (valid only) */}
                        {validationResult.result === 'VALID' && (
                          <div className="animate-bt-fade-in text-center space-y-1.5 mt-1">
                            <p className="text-foreground font-medium text-base">
                              {validationResult.passengerName}
                            </p>
                            <p className="text-muted-foreground text-[13px] font-mono">
                              {validationResult.routeName}
                            </p>
                            <Badge
                              variant="secondary"
                              className="mt-1.5 font-mono text-[12px] px-2.5 py-0.5"
                            >
                              Seat {validationResult.seatNumber}
                            </Badge>
                          </div>
                        )}

                        {/* Reason (non-valid) */}
                        {validationResult.result !== 'VALID' && validationResult.reason && (
                          <p className="text-[12px] text-muted-foreground mt-1">
                            {validationResult.reason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {!validationResult && !validating && (
                      <div className="flex flex-col items-center gap-2.5 text-muted-foreground/30 select-none">
                        <Bus className="h-10 w-10" />
                        <span className="text-[12px]">Waiting for scan…</span>
                      </div>
                    )}

                    {/* Loading state */}
                    {validating && (
                      <div className="animate-bt-fade-in flex flex-col items-center gap-2.5 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        <span className="text-[12px]">Validating…</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Right: Boarding (2 cols) ─── */}
              <div className="lg:col-span-2 animate-bt-slide-up delay-200">
                <div className="border border-border/60 bg-card rounded-xl p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">Boarding</h2>
                      <p className="text-[11px] text-muted-foreground">Real-time passenger boarding status</p>
                    </div>
                  </div>

                  {!boardingInfo ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Separator className="my-2" />
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Progress ring + count */}
                      <div className="flex flex-col items-center mb-4">
                        <div className="relative flex items-center justify-center">
                          <ProgressRing value={progressValue} size={88} strokeWidth={5} />
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-bold tracking-tight text-foreground leading-none">
                              {boardingCount}
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              /{boardingTotal}
                            </span>
                          </div>
                        </div>
                        <span className="text-[12px] text-muted-foreground mt-2 font-medium">
                          {boardingPct}% boarded
                        </span>
                      </div>

                      {/* Progress bar (compact) */}
                      <div className="h-1.5 rounded-full bg-border mb-4 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                          style={{ width: `${boardingPct}%` }}
                        />
                      </div>

                      <Separator className="mb-4" />

                      {/* Boarded list */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Passengers</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {boardingCount} of {boardingTotal}
                        </span>
                      </div>

                      <div className="flex-1 max-h-72 overflow-y-auto bt-scroll pr-1">
                        {boardingInfo.boarded?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {boardingInfo.boarded.map((b: any, i: number) => (
                              <div
                                key={b.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                              >
                                <span className="text-[11px] text-muted-foreground font-mono w-4 text-right tabular-nums">
                                  {i + 1}
                                </span>
                                <span className="flex-1 text-[13px] text-foreground truncate">
                                  {b.passengerName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[11px] h-5 px-1.5 border-border/60"
                                >
                                  {b.seatNumber}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-muted-foreground/50 text-center py-8">
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
        </div>
      </main>
    </div>
  );
}