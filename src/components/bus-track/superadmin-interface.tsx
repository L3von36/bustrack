'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, Plus, MapPin, DollarSign, Users, TrendingUp,
  LayoutDashboard, Route, UserCog, BarChart3, Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppHeader } from './app-header';
import { STATUS_COLORS, CHART_COLORS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser } from './types';

interface SuperadminInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

export function SuperadminInterface({ user, onLogout, toast }: SuperadminInterfaceProps) {
  const { isConnected, on, joinDashboard } = useRealtimeSocket();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [newRoute, setNewRoute] = useState({ origin: '', destination: '', distanceKm: '', baseFare: '', estimatedMin: '' });
  const [newBus, setNewBus] = useState({ plateNumber: '', busType: 'STANDARD', totalSeats: '', rows: '', cols: '4' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: 'password', role: 'TICKETER' });

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, depRes, routesRes, busesRes, staffRes, analyticsRes] = await Promise.all([
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

  const handleAddRoute = async () => {
    if (!newRoute.origin || !newRoute.destination || !newRoute.distanceKm || !newRoute.baseFare || !newRoute.estimatedMin) return;
    try {
      const stationId = routes[0]?.stationId || staff[0]?.stationId || '';
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRoute, stationId }),
      });
      const data = await res.json();
      if (data.route) {
        toast({ title: 'Route Created', description: `${newRoute.origin} → ${newRoute.destination}` });
        setAddRouteOpen(false);
        setNewRoute({ origin: '', destination: '', distanceKm: '', baseFare: '', estimatedMin: '' });
        fetchAll();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create route', variant: 'destructive' });
    }
  };

  const handleAddBus = async () => {
    if (!newBus.plateNumber || !newBus.totalSeats || !newBus.rows || !newBus.cols) return;
    try {
      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBus),
      });
      const data = await res.json();
      if (data.bus) {
        toast({ title: 'Bus Added', description: `${newBus.plateNumber}` });
        setAddBusOpen(false);
        setNewBus({ plateNumber: '', busType: 'STANDARD', totalSeats: '', rows: '', cols: '4' });
        fetchAll();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add bus', variant: 'destructive' });
    }
  };

  const kpis = stats ? [
    { label: 'Revenue', value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Passengers', value: stats.totalPassengers || 0, icon: <Users className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Buses', value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`, icon: <Bus className="h-5 w-5" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
    { label: 'On-Time', value: `${stats.onTimeRate || 0}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  ] : [];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'routes', label: 'Routes', icon: <Route className="h-4 w-4" /> },
    { id: 'buses', label: 'Buses', icon: <Car className="h-4 w-4" /> },
    { id: 'staff', label: 'Staff', icon: <UserCog className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-screen flex bg-background"
    >
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r bg-card flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Bus className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-sm">BusTrack</p>
              <p className="text-[10px] text-muted-foreground">Superadmin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 h-9 text-sm ${activeTab === item.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon} {item.label}
            </Button>
          ))}
        </nav>
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">Superadmin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header with Tab Switcher */}
        <div className="md:hidden border-b bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Bus className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-sm">BusTrack</span>
            </div>
            <div className="flex items-center gap-1">
              {isConnected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLogout}>Logout</Button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs shrink-0 gap-1"
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon} {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Overview</h2>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {kpis.map((kpi, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{kpi.label}</span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold">{kpi.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Today&apos;s Departures</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Route</TableHead>
                              <TableHead className="hidden sm:table-cell">Bus</TableHead>
                              <TableHead>Gate</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Occ.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {departures.map((d: any) => (
                              <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.routeName}</TableCell>
                                <TableCell className="hidden sm:table-cell">{d.busPlate}</TableCell>
                                <TableCell>{d.gateNumber || '—'}</TableCell>
                                <TableCell className="font-mono">{d.departureTime}</TableCell>
                                <TableCell><Badge className={STATUS_COLORS[d.status] || ''}>{d.status}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={d.occupancy} className="w-16 h-2" />
                                    <span className="text-xs">{d.occupancy}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Routes</h2>
                <Button size="sm" onClick={() => setAddRouteOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Route
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Origin</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead className="hidden sm:table-cell">Distance</TableHead>
                          <TableHead>Base Fare</TableHead>
                          <TableHead className="hidden sm:table-cell">Est. Time</TableHead>
                          <TableHead>Schedules</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> {r.origin}</TableCell>
                            <TableCell className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> {r.destination}</TableCell>
                            <TableCell className="hidden sm:table-cell">{r.distanceKm} km</TableCell>
                            <TableCell>KES {r.baseFare.toLocaleString()}</TableCell>
                            <TableCell className="hidden sm:table-cell">{r.estimatedMin} min</TableCell>
                            <TableCell><Badge variant="secondary">{r._count?.schedules || 0}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Dialog open={addRouteOpen} onOpenChange={setAddRouteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Route</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Origin</Label><Input value={newRoute.origin} onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Destination</Label><Input value={newRoute.destination} onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Distance (km)</Label><Input type="number" value={newRoute.distanceKm} onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Base Fare (KES)</Label><Input type="number" value={newRoute.baseFare} onChange={(e) => setNewRoute({ ...newRoute, baseFare: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Est. Time (min)</Label><Input type="number" value={newRoute.estimatedMin} onChange={(e) => setNewRoute({ ...newRoute, estimatedMin: e.target.value })} className="mt-1" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddRouteOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddRoute}>Create Route</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* BUSES TAB */}
          {activeTab === 'buses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Buses</h2>
                <Button size="sm" onClick={() => setAddBusOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Bus
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plate Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Seats</TableHead>
                          <TableHead className="hidden sm:table-cell">Layout</TableHead>
                          <TableHead>Schedules</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buses.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono font-medium">{b.plateNumber}</TableCell>
                            <TableCell><Badge variant="outline">{b.busType}</Badge></TableCell>
                            <TableCell>{b.totalSeats}</TableCell>
                            <TableCell className="hidden sm:table-cell">{b.rows} x {b.cols}</TableCell>
                            <TableCell><Badge variant="secondary">{b._count?.schedules || 0}</Badge></TableCell>
                            <TableCell>
                              <Badge className={b.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                                {b.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Dialog open={addBusOpen} onOpenChange={setAddBusOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Bus</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-2"><Label className="text-xs">Plate Number</Label><Input value={newBus.plateNumber} onChange={(e) => setNewBus({ ...newBus, plateNumber: e.target.value })} className="mt-1" placeholder="KBA 123A" /></div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={newBus.busType} onValueChange={(v) => setNewBus({ ...newBus, busType: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="EXECUTIVE">Executive</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                          <SelectItem value="PREMIUM">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Total Seats</Label><Input type="number" value={newBus.totalSeats} onChange={(e) => setNewBus({ ...newBus, totalSeats: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Rows</Label><Input type="number" value={newBus.rows} onChange={(e) => setNewBus({ ...newBus, rows: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Columns</Label><Input type="number" value={newBus.cols} onChange={(e) => setNewBus({ ...newBus, cols: e.target.value })} className="mt-1" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddBusOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddBus}>Add Bus</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* STAFF TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Staff</h2>
                <Button size="sm" onClick={() => setAddStaffOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden sm:table-cell">Bookings</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{s.email}</TableCell>
                            <TableCell><Badge variant="outline">{s.role}</Badge></TableCell>
                            <TableCell className="hidden sm:table-cell">{s._count?.bookings || 0}</TableCell>
                            <TableCell>
                              <Badge className={s.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                                {s.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div><Label className="text-xs">Full Name</Label><Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Email</Label><Input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="mt-1" /></div>
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TICKETER">Ticketer</SelectItem>
                          <SelectItem value="CASHIER">Cashier</SelectItem>
                          <SelectItem value="GATEMAN">Gateman</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddStaffOpen(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      if (!newStaff.name || !newStaff.email) return;
                      try {
                        const stationId = staff[0]?.stationId || routes[0]?.stationId || '';
                        const res = await fetch('/api/admin/staff', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...newStaff, stationId }),
                        });
                        if (res.ok) {
                          toast({ title: 'Staff Added', description: newStaff.name });
                          setAddStaffOpen(false);
                          setNewStaff({ name: '', email: '', password: 'password', role: 'TICKETER' });
                          fetchAll();
                        }
                      } catch {
                        toast({ title: 'Error', variant: 'destructive' });
                      }
                    }}>Add Staff</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Analytics</h2>
              {loading || !analytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Skeleton className="h-80 rounded-xl" />
                  <Skeleton className="h-80 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Revenue by Route</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.revenueByRoute?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analytics.revenueByRoute}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="routeName" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <RTooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="oklch(0.55 0.2 260)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Passengers by Route</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.seatOccupancy?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={analytics.seatOccupancy} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percentage }) => `${name.split('→')[1]?.trim() || name} ${percentage}%`}>
                              {analytics.seatOccupancy.map((_: any, index: number) => (
                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}