'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Users, Bus, TrendingUp, Activity, AlertTriangle,
  Zap, Clock, BarChart3, Brain, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AppHeader } from './app-header';
import { useRealtimeSocket, useActivityFeed } from '@/hooks/use-realtime';
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

// ─── Status Config ───────────────────────────────────────────────

const STATUS_DOT_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-zinc-500',
  BOARDING: 'bg-amber-400',
  DEPARTED: 'bg-emerald-400',
  DELAYED: 'bg-orange-400',
  CANCELLED: 'bg-red-400',
};

const STATUS_LABEL_COLOR: Record<string, string> = {
  SCHEDULED: 'text-zinc-400',
  BOARDING: 'text-amber-400',
  DEPARTED: 'text-emerald-400',
  DELAYED: 'text-orange-400',
  CANCELLED: 'text-red-400',
};

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
  'booking-created': 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  'payment-completed': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  'gate-event': 'text-amber-400 border-amber-400/20 bg-amber-400/5',
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
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
          change: '+8%',
          changeDirection: 'up',
        },
        {
          label: 'Passengers',
          value: `${stats.totalPassengers || 0}`,
          raw: stats.totalPassengers || 0,
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          change: '+3',
          changeDirection: 'up',
        },
        {
          label: 'Buses',
          value: `${stats.busesDeparted || 0}`,
          raw: stats.busesDeparted || 0,
          icon: <Bus className="h-4 w-4 text-muted-foreground" />,
          change: null,
          changeDirection: 'neutral',
        },
        {
          label: 'On-Time',
          value: `${stats.onTimeRate || 0}%`,
          raw: stats.onTimeRate || 0,
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
          change: '-1%',
          changeDirection: 'down',
        },
      ]
    : [];

  // ── Render ──

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-screen flex flex-col bg-background"
    >
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <main className="flex-1 overflow-y-auto btr-scroll">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ─── KPI Row ─── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="btr-card p-4 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="btr-label text-muted-foreground">{kpi.label}</span>
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                        {kpi.icon}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="btr-kpi text-foreground">{kpi.value}</span>
                      {kpi.change && (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-medium pb-0.5 ${
                            kpi.changeDirection === 'up'
                              ? 'text-emerald-400'
                              : kpi.changeDirection === 'down'
                                ? 'text-red-400'
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
                </motion.div>
              ))}
            </div>
          )}

          {/* ─── Live Departure Board ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="btr-label text-muted-foreground">Live Departures</span>
              <div className="flex-1 h-px bg-border" />
              {isConnected && (
                <div className="flex items-center gap-1.5">
                  <div className="btr-dot bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-muted-foreground">Live</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="btr-card">
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ) : departures.length === 0 ? (
              <div className="btr-card">
                <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                  <Activity className="h-5 w-5" />
                  <span className="text-xs">No departures scheduled</span>
                </div>
              </div>
            ) : (
              <div className="btr-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="btr-label text-muted-foreground h-9">
                          Route
                        </TableHead>
                        <TableHead className="btr-label text-muted-foreground h-9 text-center">
                          Time
                        </TableHead>
                        <TableHead className="btr-label text-muted-foreground h-9 text-center hidden sm:table-cell">
                          Gate
                        </TableHead>
                        <TableHead className="btr-label text-muted-foreground h-9">
                          Status
                        </TableHead>
                        <TableHead className="btr-label text-muted-foreground h-9 text-right">
                          Boarded
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departures.map((d: DepartureRow, i: number) => (
                        <motion.tr
                          key={d.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.04, duration: 0.25 }}
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
                            <div className="flex items-center gap-2">
                              <div className={`btr-dot ${STATUS_DOT_COLOR[d.status] || 'bg-zinc-500'}`} />
                              <span
                                className={`text-xs font-medium capitalize ${STATUS_LABEL_COLOR[d.status] || 'text-muted-foreground'}`}
                              >
                                {d.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-foreground/40"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.occupancy}%` }}
                                  transition={{ duration: 0.6, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                                {d.bookedCount ?? '—'}/{d.totalSeats ?? '—'}
                              </span>
                            </div>
                          </TableCell>
                        </motion.tr>
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
            <section className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="btr-label text-muted-foreground">AI Insights</span>
                <div className="flex-1 h-px bg-border" />
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-foreground/10 text-muted-foreground bg-transparent font-normal"
                >
                  4 active
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_INSIGHTS.map((insight, i) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.06,
                      duration: 0.3,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    <div className="btr-card p-4 h-full group">
                      <div className="flex gap-3">
                        {/* Left accent */}
                        <div
                          className={`w-0.5 rounded-full shrink-0 self-stretch ${insight.accent} opacity-50 group-hover:opacity-100 transition-opacity`}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {insight.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 border-foreground/10 text-muted-foreground bg-transparent font-normal"
                          >
                            {insight.tag}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Activity Feed — 2/5 width */}
            <section className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="btr-label text-muted-foreground">Activity</span>
                <div className="flex-1 h-px bg-border" />
                {activities.length > 0 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {activities.length}
                  </span>
                )}
              </div>

              <div className="btr-card overflow-hidden">
                <div className="max-h-[340px] overflow-y-auto btr-scroll">
                  {activities.length === 0 ? (
                    <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-xs">No activity yet</span>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {activities.slice(0, 20).map((a, i) => (
                        <motion.div
                          key={`${a.timestamp}-${i}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className="flex items-start gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          {/* Type badge */}
                          <span
                            className={`shrink-0 mt-0.5 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                              ACTIVITY_TYPE_COLOR[a.type] || 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5'
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
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </motion.div>
  );
}