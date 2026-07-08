'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Plus, MapPin, DollarSign, Users, TrendingUp,
  LayoutDashboard, Route, UserCog, BarChart3, Car,
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
      label: 'Revenue',
      value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <DollarSign className="h-4 w-4" />,
      accent: 'text-emerald-500',
    },
    {
      label: 'Passengers',
      value: (stats.totalPassengers || 0).toLocaleString(),
      icon: <Users className="h-4 w-4" />,
      accent: 'text-blue-500',
    },
    {
      label: 'Buses',
      value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`,
      icon: <Bus className="h-4 w-4" />,
      accent: 'text-purple-500',
    },
    {
      label: 'On-Time',
      value: `${stats.onTimeRate || 0}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      accent: 'text-amber-500',
    },
  ] : [];

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* ─── Render helpers ─── */
  const renderKPIs = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="btr-card p-4">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="btr-card p-4 group">
            <div className="flex items-center justify-between mb-3">
              <span className="btr-label text-muted-foreground">{kpi.label}</span>
              <div className={`${kpi.accent} opacity-60 group-hover:opacity-100 transition-opacity`}>
                {kpi.icon}
              </div>
            </div>
            <p className="btr-kpi text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderDeparturesTable = () => (
    <div className="btr-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Today&apos;s departures</h3>
      </div>
      <div className="overflow-x-auto btr-scroll">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="btr-label h-11 text-muted-foreground">Route</TableHead>
              <TableHead className="btr-label h-11 text-muted-foreground hidden sm:table-cell">Bus</TableHead>
              <TableHead className="btr-label h-11 text-muted-foreground">Gate</TableHead>
              <TableHead className="btr-label h-11 text-muted-foreground">Time</TableHead>
              <TableHead className="btr-label h-11 text-muted-foreground">Status</TableHead>
              <TableHead className="btr-label h-11 text-muted-foreground text-right">Occ.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departures.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  No departures scheduled
                </TableCell>
              </TableRow>
            ) : (
              departures.map((d: any) => (
                <TableRow key={d.id} className="h-11 border-border/30">
                  <TableCell className="text-sm font-medium text-foreground">{d.routeName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">{d.busPlate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.gateNumber || '—'}</TableCell>
                  <TableCell className="text-sm font-mono text-foreground">{d.departureTime}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={d.occupancy} className="w-14 h-1.5" />
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{d.occupancy}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderRoutesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Routes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{routes.length} routes configured</p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddRouteOpen(true)}
          className="gap-1.5 btr-press"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add route</span>
        </Button>
      </div>

      <div className="btr-card overflow-hidden">
        <div className="overflow-x-auto btr-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="btr-label h-11 text-muted-foreground">Origin</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Destination</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground hidden sm:table-cell">Distance</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Fare</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground hidden md:table-cell">Est.</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground text-right">Schedules</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                    No routes yet
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((r: any) => (
                  <TableRow key={r.id} className="h-11 border-border/30">
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground/60" />
                        <span className="font-medium text-foreground">{r.origin}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-foreground">{r.destination}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{r.distanceKm} km</TableCell>
                    <TableCell className="text-sm font-medium text-foreground tabular-nums">KES {r.baseFare?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{r.estimatedMin} min</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-md font-mono">
                        {r._count?.schedules || 0}
                      </Badge>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add new route</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Define a new route with origin, destination, and fare details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Origin</Label>
              <Input
                value={newRoute.origin}
                onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                placeholder="e.g. Nairobi"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Destination</Label>
              <Input
                value={newRoute.destination}
                onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                placeholder="e.g. Mombasa"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Distance (km)</Label>
              <Input
                type="number"
                value={newRoute.distanceKm}
                onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })}
                placeholder="480"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Base fare (KES)</Label>
              <Input
                type="number"
                value={newRoute.baseFare}
                onChange={(e) => setNewRoute({ ...newRoute, baseFare: e.target.value })}
                placeholder="1200"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="btr-label text-muted-foreground">Estimated time (min)</Label>
              <Input
                type="number"
                value={newRoute.estimatedMin}
                onChange={(e) => setNewRoute({ ...newRoute, estimatedMin: e.target.value })}
                placeholder="360"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddRouteOpen(false)}
              className="btr-press text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoute}
              disabled={submittingRoute || !newRoute.origin || !newRoute.destination || !newRoute.distanceKm || !newRoute.baseFare || !newRoute.estimatedMin}
              className="btr-press text-sm"
            >
              {submittingRoute ? 'Creating...' : 'Create route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderBusesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Buses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{buses.length} buses in fleet</p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddBusOpen(true)}
          className="gap-1.5 btr-press"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add bus</span>
        </Button>
      </div>

      <div className="btr-card overflow-hidden">
        <div className="overflow-x-auto btr-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="btr-label h-11 text-muted-foreground">Plate</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Type</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Seats</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground hidden sm:table-cell">Layout</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground text-right hidden sm:table-cell">Schedules</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                    No buses registered
                  </TableCell>
                </TableRow>
              ) : (
                buses.map((b: any) => (
                  <TableRow key={b.id} className="h-11 border-border/30">
                    <TableCell className="text-sm font-mono font-medium text-foreground">{b.plateNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-md font-medium">
                        {b.busType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-foreground">{b.totalSeats}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{b.rows}×{b.cols}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-md font-mono">
                        {b._count?.schedules || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${b.active ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        <span className="text-xs text-muted-foreground">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add new bus</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Register a new bus with its seat configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="btr-label text-muted-foreground">Plate number</Label>
              <Input
                value={newBus.plateNumber}
                onChange={(e) => setNewBus({ ...newBus, plateNumber: e.target.value })}
                placeholder="KBA 123A"
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Type</Label>
              <Select value={newBus.busType} onValueChange={(v) => setNewBus({ ...newBus, busType: v })}>
                <SelectTrigger className="h-9 text-sm">
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
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Total seats</Label>
              <Input
                type="number"
                value={newBus.totalSeats}
                onChange={(e) => setNewBus({ ...newBus, totalSeats: e.target.value })}
                placeholder="36"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Rows</Label>
              <Input
                type="number"
                value={newBus.rows}
                onChange={(e) => setNewBus({ ...newBus, rows: e.target.value })}
                placeholder="9"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Columns</Label>
              <Input
                type="number"
                value={newBus.cols}
                onChange={(e) => setNewBus({ ...newBus, cols: e.target.value })}
                placeholder="4"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddBusOpen(false)}
              className="btr-press text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBus}
              disabled={submittingBus || !newBus.plateNumber || !newBus.totalSeats || !newBus.rows || !newBus.cols}
              className="btr-press text-sm"
            >
              {submittingBus ? 'Adding...' : 'Add bus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderStaffTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Staff</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{staff.length} team members</p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddStaffOpen(true)}
          className="gap-1.5 btr-press"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add staff</span>
        </Button>
      </div>

      <div className="btr-card overflow-hidden">
        <div className="overflow-x-auto btr-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="btr-label h-11 text-muted-foreground">Name</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground hidden sm:table-cell">Email</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Role</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground text-right hidden sm:table-cell">Bookings</TableHead>
                <TableHead className="btr-label h-11 text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                    No staff members
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s: any) => (
                  <TableRow key={s.id} className="h-11 border-border/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
                          {s.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{s.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-md font-medium">
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground text-right hidden sm:table-cell">
                      {s._count?.bookings || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        <span className="text-xs text-muted-foreground">
                          {s.active ? 'Active' : 'Inactive'}
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

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add new staff</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Invite a new team member. They can reset their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Full name</Label>
              <Input
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="John Doe"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="john@bustrack.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="btr-label text-muted-foreground">Role</Label>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                <SelectTrigger className="h-9 text-sm">
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
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddStaffOpen(false)}
              className="btr-press text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStaff}
              disabled={submittingStaff || !newStaff.name || !newStaff.email}
              className="btr-press text-sm"
            >
              {submittingStaff ? 'Adding...' : 'Add staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderAnalyticsTab = () => {
    if (loading || !analytics) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue and passenger metrics</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="btr-card p-4">
              <Skeleton className="h-3 w-32 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="btr-card p-4">
              <Skeleton className="h-3 w-32 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue and passenger metrics</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Bar Chart */}
          <div className="btr-card p-4">
            <h3 className="btr-label text-muted-foreground mb-4">Revenue by route</h3>
            {analytics.revenueByRoute?.length > 0 ? (
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
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                      color: 'var(--popover-foreground)',
                    }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[4, 4, 0, 0]}
                    fill="var(--primary)"
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </div>

          {/* Passengers Pie Chart */}
          <div className="btr-card p-4">
            <h3 className="btr-label text-muted-foreground mb-4">Passengers by route</h3>
            {analytics.seatOccupancy?.length > 0 ? (
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
                    strokeWidth={2}
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
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                      color: 'var(--popover-foreground)',
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
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                No passenger data yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Main render ─── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Header */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Desktop Sidebar ─── */}
        <aside className="hidden md:flex w-56 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
          <nav className="flex-1 p-2 space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-100
                  ${activeTab === tab.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar user */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center text-[11px] font-semibold text-sidebar-accent-foreground shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50">Superadmin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Mobile Tab Bar ─── */}
        <div className="md:hidden flex border-b border-border bg-card">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-medium transition-colors duration-100
                ${activeTab === tab.id
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Content Area ─── */}
        <main className="flex-1 overflow-y-auto btr-scroll">
          <div className="p-4 sm:p-6 max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Overview</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Real-time station performance</p>
                    </div>
                    {renderKPIs()}
                    {renderDeparturesTable()}
                  </div>
                )}

                {activeTab === 'routes' && renderRoutesTab()}
                {activeTab === 'buses' && renderBusesTab()}
                {activeTab === 'staff' && renderStaffTab()}
                {activeTab === 'analytics' && renderAnalyticsTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </motion.div>
  );
}