'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Users, Bus, TrendingUp, Activity, Brain,
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
    title: 'High Demand Predicted',
    description: 'Nairobi → Mombasa shows 40% higher booking rate. Consider adding buses at 11:00 and 14:00.',
    tag: 'Demand',
  },
  {
    accent: 'bg-emerald-500',
    title: 'Revenue Above Average',
    description: "Today's revenue is tracking 12% above the 7-day rolling average. Payment processing improved by 0.8s.",
    tag: 'Revenue',
  },
  {
    accent: 'bg-orange-500',
    title: 'Departure Delay Risk',
    description: 'The 09:30 Kisumu bus has 45% boarding with 12 min to departure. PA announcements may help.',
    tag: 'Operations',
  },
  {
    accent: 'bg-zinc-400',
    title: 'Staff Utilization Optimal',
    description: 'All 3 tills active with balanced queues (avg 2.3 waiting). No reallocation needed.',
    tag: 'Staff',
  },
];

// ─── Activity type colors ────────────────────────────────────────

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  'booking-created': 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50 dark:bg-emerald-900/20',
  'payment-completed': 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50 dark:bg-emerald-900/20',
  'gate-event': 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800/50 dark:bg-amber-900/20',
};

// ─── Helpers ─────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          value: `KES ${Math.round((stats.totalRevenue || 0) / 1000)}K`,
          raw: stats.totalRevenue || 0,
          icon: <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          change: '+8%',
          changeDirection: 'up',
        },
        {
          label: 'Passengers',
          value: `${stats.totalPassengers || 0}`,
          raw: stats.totalPassengers || 0,
          icon: <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          change: '+3',
          changeDirection: 'up',
        },
        {
          label: 'Buses',
          value: `${stats.busesDeparted || 0}`,
          raw: stats.busesDeparted || 0,
          icon: <Bus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          change: null,
          changeDirection: 'neutral',
        },
        {
          label: 'On-Time',
          value: `${stats.onTimeRate || 0}%`,
          raw: stats.onTimeRate || 0,
          icon: <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
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
            {/* ─── KPI Row ─── */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                  <div
                    key={kpi.label}
                    className="animate-bt-slide-up border border-border/60 bg-card rounded-xl p-5"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {kpi.label}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                        {kpi.icon}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {kpi.value}
                      </span>
                      {kpi.change && (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-medium pb-1 ${
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
                  </div>
                ))}
              </div>
            )}

            {/* ─── Live Departure Board ─── */}
            <section className="animate-bt-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Live Departures
                </span>
                <div className="flex-1 h-px bg-border/60" />
                {isConnected && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] text-muted-foreground">Live</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="border border-border/60 bg-card rounded-xl">
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              ) : departures.length === 0 ? (
                <div className="border border-border/60 bg-card rounded-xl">
                  <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-5 w-5" />
                    <span className="text-xs">No departures scheduled</span>
                  </div>
                </div>
              ) : (
                <div className="border border-border/60 bg-card rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/40">
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-10">
                            Route
                          </TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-10 text-center">
                            Time
                          </TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-10 text-center hidden sm:table-cell">
                            Gate
                          </TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-10">
                            Status
                          </TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider h-10 text-right">
                            Boarded
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departures.map((d: DepartureRow, i: number) => (
                          <TableRow
                            key={d.id}
                            className="border-border/30 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Bus className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />
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
                            <TableCell className="py-3 text-center">
                              <span className="text-sm font-mono text-foreground tabular-nums">
                                {d.departureTime}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-center hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {d.gateNumber || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border-0 capitalize ${
                                  STATUS_COLORS[d.status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                {d.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center justify-end gap-3">
                                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-700 ease-out"
                                    style={{ width: `${d.occupancy}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                                  {d.bookedCount ?? '—'}/{d.totalSeats ?? '—'}
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

            {/* ─── Insights + Activity ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* AI Insights — 3/5 width */}
              <section className="lg:col-span-3 animate-bt-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    AI Insights
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-2 rounded-full border-border/60 text-muted-foreground bg-transparent font-normal"
                  >
                    4 active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_INSIGHTS.map((insight, i) => (
                    <div
                      key={insight.title}
                      className="border border-border/60 bg-card rounded-xl p-4 h-full group hover:border-border/80 transition-colors"
                      style={{ animationDelay: `${300 + i * 60}ms` }}
                    >
                      <div className="flex gap-3">
                        {/* Left accent */}
                        <div
                          className={`w-0.5 rounded-full shrink-0 self-stretch ${insight.accent} opacity-40 group-hover:opacity-80 transition-opacity`}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <span className="text-sm font-medium text-foreground block truncate">
                            {insight.title}
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 rounded-full border-border/60 text-muted-foreground bg-transparent font-normal"
                          >
                            {insight.tag}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Activity Feed — 2/5 width */}
              <section className="lg:col-span-2 animate-bt-slide-up" style={{ animationDelay: '250ms' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Activity
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  {activities.length > 0 && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {activities.length}
                    </span>
                  )}
                </div>

                <div className="border border-border/60 bg-card rounded-xl overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto bt-scroll">
                    {activities.length === 0 ? (
                      <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-xs">No activity yet</span>
                      </div>
                    ) : (
                      activities.slice(0, 20).map((a, i) => (
                        <div
                          key={`${a.timestamp}-${i}`}
                          className="flex items-start gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          {/* Type badge */}
                          <span
                            className={`shrink-0 mt-0.5 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${
                              ACTIVITY_TYPE_COLOR[a.type] || 'text-zinc-400 border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50'
                            }`}
                          >
                            {a.type
                              .replace('dashboard:', '')
                              .replace(/-/g, ' ')}
                          </span>

                          {/* Message + time */}
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="text-xs text-foreground leading-relaxed truncate">
                              {a.message}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
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
          </div>
        </div>
      </main>
    </div>
  );
}