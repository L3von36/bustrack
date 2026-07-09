'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Users, Bus, TrendingUp, Activity, Sparkles,
  ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AppHeader } from './app-header';
import { useRealtimeSocket, useActivityFeed } from '@/hooks/use-realtime';
import { STATUS_COLORS } from './constants';
import type { StaffUser } from './types';

// ─── Types ───────────────────────────────────────────────────────

interface ManagerInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

interface KpiData {
  label: string;
  value: string;
  raw: number;
  icon: React.ReactNode;
  iconGradient: string;
  iconBg: string;
  borderColor: string;
  change: string | null;
  changeDirection: 'up' | 'down' | 'neutral';
}

interface DepartureRow {
  id: string;
  routeName: string;
  busPlate: string;
  busType: string;
  gateNumber: string | null;
  departureTime: string;
  status: string;
  occupancy: number;
  bookedCount?: number;
  totalSeats?: number;
}

// ─── AI Insights (Static) ───────────────────────────────────────

const AI_INSIGHTS = [
  {
    accent: 'bg-amber-500',
    tagBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    title: 'High Demand Predicted',
    description: 'Addis Ababa → Dire Dawa shows 40% higher booking rate. Consider adding buses at 11:00 and 14:00.',
    tag: 'Demand',
  },
  {
    accent: 'bg-emerald-500',
    tagBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    title: 'Revenue Above Average',
    description: "Today's revenue is tracking 12% above the 7-day rolling average. Payment processing improved by 0.8s.",
    tag: 'Revenue',
  },
  {
    accent: 'bg-orange-500',
    tagBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    title: 'Departure Delay Risk',
    description: 'The 09:30 Bahir Dar bus has 45% boarding with 12 min to departure. PA announcements may help.',
    tag: 'Operations',
  },
  {
    accent: 'bg-zinc-400',
    tagBg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300',
    title: 'Staff Utilization Optimal',
    description: 'All 3 tills active with balanced queues (avg 2.3 waiting). No reallocation needed.',
    tag: 'Staff',
  },
];

// ─── Activity type dot colors ────────────────────────────────────

const ACTIVITY_DOT_COLOR: Record<string, string> = {
  'booking-created': 'bg-emerald-500',
  'payment-completed': 'bg-emerald-500',
  'gate-event': 'bg-amber-500',
};

// ─── Status dot colors for departure table ───────────────────────

const STATUS_DOT_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-emerald-500',
  BOARDING: 'bg-amber-500',
  DEPARTED: 'bg-zinc-400',
  CANCELLED: 'bg-red-500',
  DELAYED: 'bg-orange-500',
};

// ─── Occupancy bar color based on percentage ─────────────────────

function getOccupancyColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500 dark:bg-red-400';
  if (pct >= 70) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-emerald-500 dark:bg-emerald-400';
}

function getOccupancyTrackColor(pct: number): string {
  if (pct >= 90) return 'bg-red-100 dark:bg-red-900/20';
  if (pct >= 70) return 'bg-amber-100 dark:bg-amber-900/20';
  return 'bg-emerald-100 dark:bg-emerald-900/20';
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── KPI Card Component ──────────────────────────────────────────

function KpiCard({ kpi, index }: { kpi: KpiData; index: number }) {
  return (
    <div
      className="animate-bt-slide-up relative bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-default overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored left border accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${kpi.borderColor}`}
      />

      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {kpi.label}
        </span>

        {/* Trend indicator in top-right */}
        {kpi.change && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
              kpi.changeDirection === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : kpi.changeDirection === 'down'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-muted-foreground'
            }`}
          >
            {kpi.changeDirection === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : kpi.changeDirection === 'down' ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {kpi.change}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        {/* Value */}
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {kpi.value}
        </span>

        {/* Gradient icon container */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${kpi.iconGradient}`}
        >
          {kpi.icon}
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────

export function ManagerInterface({ user, onLogout, toast }: ManagerInterfaceProps) {
  const { isConnected, on, joinDashboard } = useRealtimeSocket();
  const activities = useActivityFeed();

  const [stats, setStats] = useState<any>(null);
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Data fetch (15s poll) ──

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, depRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/departures'),
      ]);
      setStats(await statsRes.json());
      const depData = await depRes.json();
      setDepartures(depData.departures || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    joinDashboard();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData, joinDashboard]);

  // ── Real-time event listeners ──

  useEffect(() => {
    const offs = [
      on('dashboard:booking-created', () => fetchData()),
      on('dashboard:payment-completed', () => fetchData()),
      on('dashboard:gate-event', () => fetchData()),
    ];
    return () => offs.forEach(off => off());
  }, [on, fetchData]);

  // ── Derive KPIs ──

  const kpis: KpiData[] = stats
    ? [
        {
          label: 'Revenue',
          value: `ETB ${Math.round((stats.totalRevenue || 0) / 1000)}K`,
          raw: stats.totalRevenue || 0,
          icon: <DollarSign className="h-5 w-5 text-white" />,
          iconGradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          iconBg: 'bg-emerald-500',
          borderColor: 'bg-emerald-500',
          change: '+8%',
          changeDirection: 'up',
        },
        {
          label: 'Passengers',
          value: `${stats.totalPassengers || 0}`,
          raw: stats.totalPassengers || 0,
          icon: <Users className="h-5 w-5 text-white" />,
          iconGradient: 'bg-gradient-to-br from-teal-500 to-teal-600',
          iconBg: 'bg-teal-500',
          borderColor: 'bg-teal-500',
          change: '+3',
          changeDirection: 'up',
        },
        {
          label: 'Buses Departed',
          value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`,
          raw: stats.busesDeparted || 0,
          icon: <Bus className="h-5 w-5 text-white" />,
          iconGradient: 'bg-gradient-to-br from-amber-500 to-amber-600',
          iconBg: 'bg-amber-500',
          borderColor: 'bg-amber-500',
          change: null,
          changeDirection: 'neutral',
        },
        {
          label: 'On-Time Rate',
          value: `${stats.onTimeRate || 0}%`,
          raw: stats.onTimeRate || 0,
          icon: <TrendingUp className="h-5 w-5 text-white" />,
          iconGradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
          iconBg: 'bg-orange-500',
          borderColor: 'bg-orange-500',
          change: '-1%',
          changeDirection: 'down',
        },
      ]
    : [];

  // ── Render ──

  return (
    <div className="h-full flex flex-col animate-bt-fade-in">
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bt-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* ═══════════════════════════════════════════════════════
                SECTION 1 — KPI Cards
            ═══════════════════════════════════════════════════════ */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[124px] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                  <KpiCard key={kpi.label} kpi={kpi} index={i} />
                ))}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                SECTION 2 — Live Departure Board
            ═══════════════════════════════════════════════════════ */}
            <section className="animate-bt-slide-up" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Live Departures
                </span>
                <div className="flex-1 h-px bg-border/60" />

                {/* LIVE indicator */}
                {isConnected && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full px-2.5 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-11 w-full" />
                    ))}
                  </div>
                </div>
              ) : departures.length === 0 ? (
                <div className="bg-card rounded-xl shadow-sm border border-border/50">
                  <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-5 w-5" />
                    <span className="text-xs">No departures scheduled</span>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50 border-border/40">
                          <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">
                            Route
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-center">
                            Time
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-center hidden sm:table-cell">
                            Gate
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">
                            Status
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-right">
                            Boarded
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departures.map((d: DepartureRow, i: number) => (
                          <TableRow
                            key={d.id}
                            className={`table-row-alt border-border/20 hover:bg-muted/40 transition-colors ${
                              i % 2 === 0 ? '' : ''
                            }`}
                          >
                            {/* Route with Bus icon */}
                            <TableCell className="py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-muted/40 flex items-center justify-center shrink-0">
                                  <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-foreground block truncate">
                                    {d.routeName}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground hidden sm:block">
                                    {d.busPlate} · {d.busType}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Time in mono font */}
                            <TableCell className="py-3.5 text-center">
                              <span className="text-sm font-mono font-medium text-foreground tabular-nums tracking-tight">
                                {d.departureTime}
                              </span>
                            </TableCell>

                            {/* Gate as pill badge */}
                            <TableCell className="py-3.5 text-center hidden sm:table-cell">
                              {d.gateNumber ? (
                                <span className="inline-flex items-center justify-center min-w-[32px] h-6 rounded-md bg-muted/80 dark:bg-muted/40 text-xs font-semibold text-foreground px-2 tabular-nums">
                                  {d.gateNumber}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            {/* Status as colored dot + text */}
                            <TableCell className="py-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`shrink-0 h-2 w-2 rounded-full ${
                                    STATUS_DOT_COLOR[d.status] || 'bg-zinc-400'
                                  }`}
                                />
                                <span className="text-xs font-medium text-foreground capitalize">
                                  {d.status.toLowerCase()}
                                </span>
                              </div>
                            </TableCell>

                            {/* Occupancy as wider progress bar with percentage */}
                            <TableCell className="py-3.5">
                              <div className="flex items-center justify-end gap-3">
                                <div className={`w-28 h-2 rounded-full overflow-hidden ${getOccupancyTrackColor(d.occupancy)}`}>
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${getOccupancyColor(d.occupancy)}`}
                                    style={{ width: `${d.occupancy}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground tabular-nums w-10 text-right">
                                  {d.occupancy}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 3 — AI Insights (60%) + Activity Feed (40%)
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ─── AI Insights — 60% (3/5) ─── */}
              <section className="lg:col-span-3 animate-bt-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    AI Insights
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                    4 active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_INSIGHTS.map((insight, i) => (
                    <div
                      key={insight.title}
                      className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-default animate-bt-slide-up"
                      style={{ animationDelay: `${280 + i * 70}ms` }}
                    >
                      {/* Colored top border (3px) */}
                      <div className={`h-[3px] w-full ${insight.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />

                      <div className="p-4">
                        <div className="space-y-2.5">
                          <span className="text-sm font-semibold text-foreground block truncate">
                            {insight.title}
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                          <Badge
                            className={`text-[10px] h-5 px-2 rounded-md font-semibold border-0 ${insight.tagBg}`}
                          >
                            {insight.tag}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ─── Activity Feed — 40% (2/5) ─── */}
              <section className="lg:col-span-2 animate-bt-slide-up" style={{ animationDelay: '260ms' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Activity
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  {activities.length > 0 && (
                    <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                      {activities.length}
                    </span>
                  )}
                </div>

                <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
                  <div className="max-h-[420px] overflow-y-auto bt-scroll">
                    {activities.length === 0 ? (
                      <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-xs">No activity yet</span>
                      </div>
                    ) : (
                      activities.slice(0, 20).map((a, i) => (
                        <div
                          key={`${a.timestamp}-${i}`}
                          className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Colored dot for activity type */}
                          <span
                            className={`shrink-0 mt-1.5 h-2 w-2 rounded-full ${
                              ACTIVITY_DOT_COLOR[a.type] || 'bg-zinc-400'
                            }`}
                          />

                          {/* Message + time */}
                          <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                            <span className="text-xs text-foreground leading-relaxed">
                              {a.message}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap pt-px">
                              {formatRelativeTime(a.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom padding for scroll */}
            <div className="h-2" />
          </div>
        </div>
      </main>
    </div>
  );
}