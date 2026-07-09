'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, Plus, MapPin, DollarSign, Users, TrendingUp, Clock,
  LayoutDashboard, Route, UserCog, BarChart3, Car, ArrowRight,
  Activity, BarChart2, PieChart as PieChartIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AppHeader } from './app-header';
import { STATUS_COLORS, CHART_COLORS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser } from './types';

/* ─── Types ─── */
interface SuperadminInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

type TabId = 'overview' | 'routes' | 'buses' | 'staff' | 'analytics';

/* ─── Constants ─── */
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'routes', label: 'Routes', icon: <Route className="h-4 w-4" /> },
  { id: 'buses', label: 'Buses', icon: <Car className="h-4 w-4" /> },
  { id: 'staff', label: 'Staff', icon: <UserCog className="h-4 w-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

const BUS_TYPES = ['STANDARD', 'EXECUTIVE', 'VIP', 'PREMIUM'] as const;
const STAFF_ROLES = ['TICKETER', 'CASHIER', 'GATEMAN', 'MANAGER', 'SUPERADMIN'] as const;

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-violet-400 to-violet-600',
  'bg-gradient-to-br from-rose-400 to-rose-600',
  'bg-gradient-to-br from-cyan-400 to-cyan-600',
  'bg-gradient-to-br from-orange-400 to-orange-600',
  'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600',
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  TICKETER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  CASHIER: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  GATEMAN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  MANAGER: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  SUPERADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

const BUS_TYPE_BADGE_COLORS: Record<string, string> = {
  STANDARD: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300',
  EXECUTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  VIP: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PREMIUM: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

/* ─── Component ─── */
export function SuperadminInterface({ user, onLogout, toast }: SuperadminInterfaceProps) {
  const { isConnected, on, joinDashboard } = useRealtimeSocket();

  // Active tab
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Data state
  const [stats, setStats] = useState<any>(null);
  const [departures, setDepartures] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [addBusOpen, setAddBusOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  // Form states
  const [newRoute, setNewRoute] = useState({
    origin: '', destination: '', distanceKm: '', baseFare: '', estimatedMin: '',
  });
  const [newBus, setNewBus] = useState({
    plateNumber: '', busType: 'STANDARD', totalSeats: '', rows: '', cols: '4',
  });
  const [newStaff, setNewStaff] = useState({
    name: '', email: '', password: 'password', role: 'TICKETER',
  });

  // Submitting states
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [submittingBus, setSubmittingBus] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  /* ─── Data fetching ─── */
  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, depRes, routesRes, busesRes, staffRes, analyticsRes] =
        await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/departures'),
          fetch('/api/admin/routes'),
          fetch('/api/admin/buses'),
          fetch('/api/admin/staff'),
          fetch('/api/admin/analytics'),
        ]);
      setStats(await statsRes.json());
      const depData = await depRes.json();
      setDepartures(depData.departures || []);
      const routesData = await routesRes.json();
      setRoutes(routesData.routes || []);
      const busesData = await busesRes.json();
      setBuses(busesData.buses || []);
      const staffData = await staffRes.json();
      setStaff(staffData.staff || []);
      setAnalytics(await analyticsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    joinDashboard();
  }, [fetchAll, joinDashboard]);

  // Real-time updates
  useEffect(() => {
    const offs = [
      on('dashboard:booking-created', () => fetchAll()),
      on('dashboard:payment-completed', () => fetchAll()),
      on('dashboard:gate-event', () => fetchAll()),
    ];
    return () => offs.forEach(off => off());
  }, [on, fetchAll]);

  /* ─── Handlers ─── */
  const handleAddRoute = async () => {
    if (!newRoute.origin || !newRoute.destination || !newRoute.distanceKm || !newRoute.baseFare || !newRoute.estimatedMin) return;
    setSubmittingRoute(true);
    try {
      const stationId = routes[0]?.stationId || staff[0]?.stationId || '';
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRoute, stationId }),
      });
      const data = await res.json();
      if (data.route) {
        toast.success(`Route created — ${newRoute.origin} → ${newRoute.destination}`);
        setAddRouteOpen(false);
        setNewRoute({ origin: '', destination: '', distanceKm: '', baseFare: '', estimatedMin: '' });
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to create route');
      }
    } catch {
      toast.error('Failed to create route');
    } finally {
      setSubmittingRoute(false);
    }
  };

  const handleAddBus = async () => {
    if (!newBus.plateNumber || !newBus.totalSeats || !newBus.rows || !newBus.cols) return;
    setSubmittingBus(true);
    try {
      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBus),
      });
      const data = await res.json();
      if (data.bus) {
        toast.success(`Bus added — ${newBus.plateNumber}`);
        setAddBusOpen(false);
        setNewBus({ plateNumber: '', busType: 'STANDARD', totalSeats: '', rows: '', cols: '4' });
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to add bus');
      }
    } catch {
      toast.error('Failed to add bus');
    } finally {
      setSubmittingBus(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) return;
    setSubmittingStaff(true);
    try {
      const stationId = staff[0]?.stationId || routes[0]?.stationId || '';
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStaff, stationId }),
      });
      if (res.ok) {
        toast.success(`Staff added — ${newStaff.name}`);
        setAddStaffOpen(false);
        setNewStaff({ name: '', email: '', password: 'password', role: 'TICKETER' });
        fetchAll();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add staff');
      }
    } catch {
      toast.error('Failed to add staff');
    } finally {
      setSubmittingStaff(false);
    }
  };

  /* ─── Derived data ─── */
  const kpis = stats ? [
    {
      label: 'Total Revenue',
      value: `ETB ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      label: 'Total Passengers',
      value: (stats.totalPassengers || 0).toLocaleString(),
      icon: <Users className="h-5 w-5" />,
      gradient: 'from-teal-500 to-teal-600',
      shadowColor: 'shadow-teal-500/20',
    },
    {
      label: 'Fleet Deployed',
      value: `${stats.busesDeparted || 0} / ${stats.totalBuses || 0}`,
      icon: <Bus className="h-5 w-5" />,
      gradient: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-500/20',
    },
    {
      label: 'On-Time Rate',
      value: `${stats.onTimeRate || 0}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: 'from-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-500/20',
    },
  ] : [];

  /* ─── Render: KPI Cards ─── */
  const renderKPIs = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-bt-fade-in group"
            style={{ animationDelay: `${(i + 1) * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {kpi.label}
              </span>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center text-white shadow-md ${kpi.shadowColor} group-hover:scale-110 transition-transform duration-200`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  /* ─── Render: Departures Table ─── */
  const renderDeparturesTable = () => {
    if (loading) {
      return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-bt-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="px-6 py-4 border-b border-border/50">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-56 rounded mt-1.5" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-bt-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Departures</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{departures.length} scheduled today</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto bt-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30 bg-muted/30">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Route</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 hidden sm:table-cell">Bus</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Gate</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Time</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Status</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-right">Occupancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departures.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Bus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No departures scheduled today</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                departures.map((d: any) => {
                  const statusColor = d.status === 'SCHEDULED'
                    ? 'bg-emerald-500'
                    : d.status === 'BOARDING'
                    ? 'bg-amber-500'
                    : d.status === 'DEPARTED'
                    ? 'bg-zinc-400'
                    : d.status === 'CANCELLED'
                    ? 'bg-red-500'
                    : d.status === 'DELAYED'
                    ? 'bg-orange-500'
                    : 'bg-zinc-400';

                  return (
                    <TableRow
                      key={d.id}
                      className="h-12 border-border/20 hover:bg-muted/40 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">{d.routeName?.split(' → ')[0] || d.routeName}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/40 hidden sm:inline" />
                          <span className="text-sm text-muted-foreground hidden sm:inline">{d.routeName?.split(' → ')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">{d.busPlate}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{d.gateNumber || '—'}</TableCell>
                      <TableCell className="text-sm font-mono text-foreground tabular-nums">{d.departureTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor}`} />
                          <span className="text-xs font-medium text-foreground capitalize">{d.status.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Progress value={d.occupancy} className="w-20 h-2 rounded-full" />
                          <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">{d.occupancy}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  /* ─── Render: Routes Tab ─── */
  const renderRoutesTab = () => (
    <div className="space-y-5 animate-bt-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Route className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Route Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{routes.length} routes configured</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setAddRouteOpen(true)}
          className="gap-1.5 rounded-full px-4 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Route</span>
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto bt-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30 bg-muted/30">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Origin</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Destination</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 hidden sm:table-cell">Distance</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Fare</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 hidden md:table-cell">Est. Time</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-right">Schedules</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No routes configured yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddRouteOpen(true)}
                        className="mt-1 gap-1.5 text-xs rounded-full"
                      >
                        <Plus className="h-3 w-3" />
                        Add your first route
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className="h-12 border-border/20 hover:bg-muted/40 transition-colors duration-150"
                  >
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium text-foreground">{r.origin}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span className="font-medium text-foreground">{r.destination}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{r.distanceKm} km</TableCell>
                    <TableCell className="text-sm font-bold text-foreground tabular-nums">ETB {r.baseFare?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {r.estimatedMin} min
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center h-6 min-w-[28px] rounded-full bg-muted text-[11px] font-semibold tabular-nums text-foreground">
                        {r._count?.schedules || 0}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Route Dialog */}
      <Dialog open={addRouteOpen} onOpenChange={setAddRouteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">Add New Route</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Define a new route with origin, destination, and fare details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Origin</Label>
              <Input
                value={newRoute.origin}
                onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                placeholder="e.g. Addis Ababa"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Destination</Label>
              <Input
                value={newRoute.destination}
                onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                placeholder="e.g. Dire Dawa"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Distance (km)</Label>
              <Input
                type="number"
                value={newRoute.distanceKm}
                onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })}
                placeholder="480"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Base fare (ETB)</Label>
              <Input
                type="number"
                value={newRoute.baseFare}
                onChange={(e) => setNewRoute({ ...newRoute, baseFare: e.target.value })}
                placeholder="1200"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Estimated time (min)</Label>
              <Input
                type="number"
                value={newRoute.estimatedMin}
                onChange={(e) => setNewRoute({ ...newRoute, estimatedMin: e.target.value })}
                placeholder="360"
                className="h-10 text-sm rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="ghost"
              onClick={() => setAddRouteOpen(false)}
              className="text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoute}
              disabled={submittingRoute || !newRoute.origin || !newRoute.destination || !newRoute.distanceKm || !newRoute.baseFare || !newRoute.estimatedMin}
              className="text-sm rounded-lg shadow-sm"
            >
              {submittingRoute ? 'Creating...' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ─── Render: Buses Tab ─── */
  const renderBusesTab = () => (
    <div className="space-y-5 animate-bt-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Car className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Fleet Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{buses.length} buses in fleet</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setAddBusOpen(true)}
          className="gap-1.5 rounded-full px-4 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Bus</span>
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto bt-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30 bg-muted/30">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Plate Number</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Type</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Seats</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 hidden sm:table-cell">Layout</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-right hidden sm:table-cell">Schedules</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Bus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No buses registered yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddBusOpen(true)}
                        className="mt-1 gap-1.5 text-xs rounded-full"
                      >
                        <Plus className="h-3 w-3" />
                        Register your first bus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                buses.map((b: any) => (
                  <TableRow
                    key={b.id}
                    className="h-12 border-border/20 hover:bg-muted/40 transition-colors duration-150"
                  >
                    <TableCell className="text-sm font-mono font-semibold text-foreground tracking-wide">
                      {b.plateNumber}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BUS_TYPE_BADGE_COLORS[b.busType] || ''}`}>
                        {b.busType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-semibold text-foreground">{b.totalSeats}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 font-mono">
                        {b.rows} <span className="text-muted-foreground/50">&times;</span> {b.cols}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center h-6 min-w-[28px] rounded-full bg-muted text-[11px] font-semibold tabular-nums text-foreground">
                        {b._count?.schedules || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${b.active ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                        <span className="text-xs font-medium text-foreground">
                          {b.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Bus Dialog */}
      <Dialog open={addBusOpen} onOpenChange={setAddBusOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">Add New Bus</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Register a new bus with its seat configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Plate Number</Label>
              <Input
                value={newBus.plateNumber}
                onChange={(e) => setNewBus({ ...newBus, plateNumber: e.target.value })}
                placeholder="KBA 123A"
                className="h-10 text-sm font-mono rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Bus Type</Label>
              <Select value={newBus.busType} onValueChange={(v) => setNewBus({ ...newBus, busType: v })}>
                <SelectTrigger className="h-10 text-sm rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUS_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-sm">
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Seats</Label>
              <Input
                type="number"
                value={newBus.totalSeats}
                onChange={(e) => setNewBus({ ...newBus, totalSeats: e.target.value })}
                placeholder="36"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rows</Label>
              <Input
                type="number"
                value={newBus.rows}
                onChange={(e) => setNewBus({ ...newBus, rows: e.target.value })}
                placeholder="9"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Columns</Label>
              <Input
                type="number"
                value={newBus.cols}
                onChange={(e) => setNewBus({ ...newBus, cols: e.target.value })}
                placeholder="4"
                className="h-10 text-sm rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="ghost"
              onClick={() => setAddBusOpen(false)}
              className="text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBus}
              disabled={submittingBus || !newBus.plateNumber || !newBus.totalSeats || !newBus.rows || !newBus.cols}
              className="text-sm rounded-lg shadow-sm"
            >
              {submittingBus ? 'Adding...' : 'Add Bus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ─── Render: Staff Tab ─── */
  const renderStaffTab = () => (
    <div className="space-y-5 animate-bt-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <UserCog className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Team Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{staff.length} team members</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setAddStaffOpen(true)}
          className="gap-1.5 rounded-full px-4 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Staff</span>
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto bt-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30 bg-muted/30">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Name</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Role</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11 text-right hidden sm:table-cell">Bookings</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest h-11">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No staff members yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddStaffOpen(true)}
                        className="mt-1 gap-1.5 text-xs rounded-full"
                      >
                        <Plus className="h-3 w-3" />
                        Add your first team member
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s: any, idx: number) => {
                  const staffInitials = s.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '??';

                  return (
                    <TableRow
                      key={s.id}
                      className="h-12 border-border/20 hover:bg-muted/40 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]}`}>
                            {staffInitials}
                          </div>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{s.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_COLORS[s.role] || ''}`}>
                          {s.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums font-semibold text-foreground text-right hidden sm:table-cell">
                        {s._count?.bookings || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                          <span className="text-xs font-medium text-foreground">
                            {s.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">Add New Staff</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Invite a new team member. They can reset their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Full Name</Label>
              <Input
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="John Doe"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email</Label>
              <Input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="john@bustrack.com"
                className="h-10 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Role</Label>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                <SelectTrigger className="h-10 text-sm rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-sm">
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="ghost"
              onClick={() => setAddStaffOpen(false)}
              className="text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStaff}
              disabled={submittingStaff || !newStaff.name || !newStaff.email}
              className="text-sm rounded-lg shadow-sm"
            >
              {submittingStaff ? 'Adding...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ─── Render: Analytics Tab ─── */
  const renderAnalyticsTab = () => {
    if (loading || !analytics) {
      return (
        <div className="space-y-5 animate-bt-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <BarChart3 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Analytics</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue and passenger metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
              <Skeleton className="h-4 w-36 rounded mb-5" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
              <Skeleton className="h-4 w-36 rounded mb-5" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      );
    }

    const hasRevenueData = analytics.revenueByRoute && analytics.revenueByRoute.length > 0;
    const hasOccupancyData = analytics.seatOccupancy && analytics.seatOccupancy.length > 0;

    return (
      <div className="space-y-5 animate-bt-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <BarChart3 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Analytics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue and passenger metrics</p>
          </div>
        </div>

        {!hasRevenueData && !hasOccupancyData ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <PieChartIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Analytics Data</h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Analytics will appear once routes are configured and bookings are processed.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue Bar Chart */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <BarChart2 className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Revenue by Route</h3>
              </div>
              {hasRevenueData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.revenueByRoute} barCategoryGap="20%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="routeName"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: 'var(--popover-foreground)',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[6, 6, 0, 0]}
                      fill="var(--primary)"
                      opacity={0.9}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <BarChart2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No revenue data yet</p>
                </div>
              )}
            </div>

            {/* Passengers Pie Chart */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <PieChartIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Passengers by Route</h3>
              </div>
              {hasOccupancyData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.seatOccupancy}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={3}
                      stroke="var(--card)"
                      label={({ name, percentage }: any) =>
                        `${name.split('→')[1]?.trim() || name} ${percentage}%`
                      }
                    >
                      {analytics.seatOccupancy.map((_: any, index: number) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: 'var(--popover-foreground)',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No passenger data yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── Main render ─── */
  return (
    <div className="h-full flex flex-col bg-background animate-bt-fade-in">
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* Tab Navigation — Premium Pill Style */}
      <nav className="shrink-0 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto bt-scroll py-2.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted/60'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bt-scroll">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Command Center</h2>
                  <p className="text-xs text-muted-foreground mt-1">Real-time station performance overview</p>
                </div>
                {renderKPIs()}
                {renderDeparturesTable()}
              </div>
            )}

            {activeTab === 'routes' && renderRoutesTab()}
            {activeTab === 'buses' && renderBusesTab()}
            {activeTab === 'staff' && renderStaffTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </div>
        </div>
      </main>
    </div>
  );
}