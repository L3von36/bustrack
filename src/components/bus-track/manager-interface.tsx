'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, Users, Bus, TrendingUp, Activity, Sparkles,
  ArrowUpRight, ArrowDownRight, BarChart3,
  Search, X, ChevronRight, AlertTriangle, Plus, Megaphone, FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  sparkColor: string;
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

interface FakePassenger {
  name: string;
  seat: string;
  status: string;
}

// ─── AI Insights (Static) ───────────────────────────────────────

const AI_INSIGHTS = [
  {
    accent: 'bg-amber-500',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-50 dark:bg-amber-900/10',
    accentBorder: 'border-amber-500/20 hover:border-amber-500/40',
    issue: 'High Demand',
    insight: 'Addis Ababa → Dire Dawa shows 40% higher booking rate than usual',
    action: 'Add 11:00 Bus',
    actionIcon: <Plus className="h-3 w-3" />,
  },
  {
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/10',
    accentBorder: 'border-emerald-500/20 hover:border-emerald-500/40',
    issue: 'Revenue Above Target',
    insight: "Today's revenue tracking 12% above 7-day rolling average",
    action: 'View Revenue Report',
    actionIcon: <FileText className="h-3 w-3" />,
  },
  {
    accent: 'bg-orange-500',
    accentText: 'text-orange-600 dark:text-orange-400',
    accentBg: 'bg-orange-50 dark:bg-orange-900/10',
    accentBorder: 'border-orange-500/20 hover:border-orange-500/40',
    issue: 'Delay Risk',
    insight: '45% boarded with 12min to departure on 09:30 Bahir Dar',
    action: 'Send PA Alert',
    actionIcon: <Megaphone className="h-3 w-3" />,
  },
  {
    accent: 'bg-zinc-400',
    accentText: 'text-zinc-500 dark:text-zinc-400',
    accentBg: 'bg-zinc-50 dark:bg-zinc-900/10',
    accentBorder: 'border-zinc-400/20 hover:border-zinc-400/40',
    issue: 'Staff Optimal',
    insight: 'All 3 tills active with balanced queues (avg 2.3 waiting)',
    action: 'Staff Overview',
    actionIcon: <Users className="h-3 w-3" />,
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

// ─── Seeded random for sparkline data ────────────────────────────

function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + '-' + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return (Math.abs(hash) % 100) / 100;
}

function generateSparklineData(label: string): number[] {
  const values: number[] = [];
  for (let i = 0; i < 7; i++) {
    values.push(seededRandom(label, i));
  }
  // Normalize so the last value is typically higher to create a slight upward trend
  const base = 0.3 + seededRandom(label, 100) * 0.4;
  return values.map((v, i) => {
    const trend = (i / 6) * 0.3;
    return Math.max(0.05, Math.min(0.95, base + v * 0.3 + trend - 0.15));
  });
}

// ─── Sparkline SVG Component ─────────────────────────────────────

function Sparkline({ data, color, width = 80, height = 24 }: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const pad = 2;
  const w = width;
  const h = height;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * innerW,
    y: pad + (1 - v) * innerH,
  }));

  // Build smooth cubic bezier path (Catmull-Rom to Bezier conversion)
  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  // Area path: same curve but closes at the bottom
  const areaD = `${pathD} L ${points[points.length - 1].x},${pad + innerH} L ${points[0].x},${pad + innerH} Z`;

  const gradientId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block mt-2" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Fake passenger manifest for drill-down ──────────────────────

const FAKE_PASSENGER_NAMES = [
  'Abebe Kebede', 'Tigist Mengistu', 'Dawit Assefa', 'Hana Tadesse',
  'Yohannes Girma', 'Selamawit Hailu', 'Bereket Wolde', 'Meron Demeke',
  'Fikadu Tadesse', 'Nardos Teklu', 'Abel Getachew', 'Sara Worku',
  'Henok Zewdu', 'Mekdes Alemu', 'Teshome Bekele',
];

function generatePassengerManifest(departure: DepartureRow): FakePassenger[] {
  const seed = departure.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 3 + (seed % 2); // 3 or 4 passengers
  const statuses = ['Boarded', 'Boarded', 'Checked In', 'Pending'];
  const passengers: FakePassenger[] = [];
  for (let i = 0; i < count; i++) {
    const nameIdx = (seed + i * 7) % FAKE_PASSENGER_NAMES.length;
    const seatNum = ((seed + i * 3) % (departure.totalSeats || 45)) + 1;
    const statusIdx = Math.min(i, statuses.length - 1);
    passengers.push({
      name: FAKE_PASSENGER_NAMES[nameIdx],
      seat: `${seatNum}A`,
      status: statuses[statusIdx],
    });
  }
  return passengers;
}

const PASSENGER_STATUS_DOT: Record<string, string> = {
  Boarded: 'bg-emerald-500',
  'Checked In': 'bg-amber-500',
  Pending: 'bg-zinc-400',
};

// ─── KPI Card Component ──────────────────────────────────────────

function KpiCard({ kpi, index }: { kpi: KpiData; index: number }) {
  const sparkData = useMemo(() => generateSparklineData(kpi.label), [kpi.label]);

  return (
    <div
      className="animate-bt-slide-up relative bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-default overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored left border accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${kpi.borderColor}`}
      />

      <div className="flex items-start justify-between mb-3">
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

      {/* Sparkline */}
      <Sparkline data={sparkData} color={kpi.sparkColor} />
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeparture, setSelectedDeparture] = useState<DepartureRow | null>(null);

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

  // ── Filtered departures ──

  const filteredDepartures = useMemo(() => {
    if (!searchQuery.trim()) return departures;
    const q = searchQuery.toLowerCase().trim();
    return departures.filter((d: DepartureRow) =>
      d.routeName.toLowerCase().includes(q)
    );
  }, [departures, searchQuery]);

  // ── Passenger manifest for selected departure ──

  const passengerManifest = useMemo(() => {
    if (!selectedDeparture) return [];
    return generatePassengerManifest(selectedDeparture);
  }, [selectedDeparture]);

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
          sparkColor: '#10b981',
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
          sparkColor: '#14b8a6',
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
          sparkColor: '#f59e0b',
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
          sparkColor: '#f97316',
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
                  <Skeleton key={i} className="h-[140px] rounded-xl" />
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  Live Departures
                </span>

                {/* Search input */}
                <div className="relative flex-1 max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search routes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 text-xs pl-8 pr-7 bg-muted/40 border-border/50 focus:bg-background focus:border-border"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 h-px bg-border/60" />

                {/* LIVE indicator */}
                {isConnected && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full px-2.5 py-1 shrink-0">
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
              ) : selectedDeparture ? (
                /* ─── Departure Detail Panel ─── */
                <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden animate-bt-fade-in">
                  {/* Header bar */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDeparture(null)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                        <span>Back</span>
                      </button>
                      <span className="text-border mx-1">/</span>
                      <span className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                        {selectedDeparture.routeName}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDeparture(null)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Route info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Bus Plate</span>
                        <span className="text-sm font-semibold text-foreground">{selectedDeparture.busPlate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Gate</span>
                        <span className="text-sm font-semibold text-foreground">{selectedDeparture.gateNumber || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Time</span>
                        <span className="text-sm font-mono font-semibold text-foreground tabular-nums tracking-tight">{selectedDeparture.departureTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Status</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`shrink-0 h-2 w-2 rounded-full ${
                              STATUS_DOT_COLOR[selectedDeparture.status] || 'bg-zinc-400'
                            }`}
                          />
                          <span className={`text-sm font-semibold capitalize ${STATUS_COLORS[selectedDeparture.status] || ''}`}>
                            {selectedDeparture.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Occupancy</span>
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                          {selectedDeparture.bookedCount || '—'} / {selectedDeparture.totalSeats || '—'} seats
                        </span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${getOccupancyTrackColor(selectedDeparture.occupancy)}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${getOccupancyColor(selectedDeparture.occupancy)}`}
                          style={{ width: `${selectedDeparture.occupancy}%` }}
                        />
                      </div>
                    </div>

                    {/* Passenger Manifest */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Passenger Manifest
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                          {passengerManifest.length} shown
                        </span>
                      </div>

                      <div className="rounded-lg border border-border/40 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border/30">
                              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">Passenger</th>
                              <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">Seat</th>
                              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {passengerManifest.map((p, i) => (
                              <tr
                                key={`${p.seat}-${i}`}
                                className={`border-b border-border/15 last:border-0 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                              >
                                <td className="px-3 py-2.5 text-xs font-medium text-foreground">{p.name}</td>
                                <td className="px-3 py-2.5 text-xs font-mono font-medium text-foreground text-center tabular-nums">{p.seat}</td>
                                <td className="px-3 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${PASSENGER_STATUS_DOT[p.status] || 'bg-zinc-400'}`} />
                                    <span className="text-xs text-muted-foreground">{p.status}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Close button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSelectedDeparture(null)}
                        className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : filteredDepartures.length === 0 ? (
                <div className="bg-card rounded-xl shadow-sm border border-border/50">
                  <div className="p-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <Search className="h-5 w-5" />
                    <span className="text-xs">No routes match &quot;{searchQuery}&quot;</span>
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
                          <TableHead className="w-8 h-11" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDepartures.map((d: DepartureRow, i: number) => (
                          <TableRow
                            key={d.id}
                            className={`table-row-alt border-border/20 hover:bg-muted/40 transition-colors cursor-pointer group ${
                              i % 2 === 0 ? '' : ''
                            }`}
                            onClick={() => setSelectedDeparture(d)}
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

                            {/* Chevron indicator */}
                            <TableCell className="py-3.5 pr-3">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors ml-auto" />
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
                      key={insight.issue}
                      className={`bg-card rounded-xl shadow-sm border overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out animate-bt-slide-up ${insight.accentBorder}`}
                      style={{ animationDelay: `${280 + i * 70}ms` }}
                    >
                      <div className="flex">
                        {/* Left accent bar (3px) */}
                        <div className={`w-[3px] shrink-0 ${insight.accent}`} />

                        <div className="flex-1 p-4 flex flex-col justify-between min-h-[100px]">
                          <div className="space-y-1.5">
                            {/* Issue title (bold) */}
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className={`h-3 w-3 shrink-0 ${insight.accentText}`} />
                              <span className="text-sm font-bold text-foreground truncate">
                                {insight.issue}
                              </span>
                            </div>

                            {/* Insight text (muted, max 1 line) */}
                            <p className="text-xs text-muted-foreground leading-relaxed truncate">
                              {insight.insight}
                            </p>
                          </div>

                          {/* Action button */}
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => toast.success(`Action triggered: ${insight.action}`)}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${insight.accentBg} ${insight.accentText} hover:opacity-80 active:scale-[0.97]`}
                            >
                              {insight.actionIcon}
                              {insight.action}
                            </button>
                          </div>
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