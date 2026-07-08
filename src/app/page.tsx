'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Ticket, CreditCard, ShieldCheck, BarChart3, LogOut, Search,
  Check, X, Users, MapPin, Clock, DollarSign, AlertTriangle,
  ArrowRight, ChevronRight, Loader2, Eye, Plus, QrCode,
  Smartphone, Wallet, Banknote, LayoutDashboard, Route, UserCog,
  Settings, TrendingUp, Activity, CalendarDays, Phone, User,
  Car, DoorOpen, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────
type Role = 'TICKETER' | 'CASHIER' | 'GATEMAN' | 'MANAGER' | 'SUPERADMIN';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  stationId: string | null;
  active: boolean;
  station?: { name: string; city: string } | null;
}

interface ScheduleItem {
  id: string;
  routeName: string;
  routeId: string;
  busPlate: string;
  busType: string;
  totalSeats: number;
  bookedCount: number;
  departureTime: string;
  fare: number;
  status: string;
  gateNumber: string | null;
}

interface BookingItem {
  id: string;
  reference: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  fare: number;
  status: string;
  createdAt: string;
  schedule: {
    route: { origin: string; destination: string };
    bus: { plateNumber: string; busType: string };
    departureTime: string;
  };
  staff: { name: string };
}

// ─── Role Config ────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<Role, { icon: React.ReactNode; color: string; desc: string; email: string }> = {
  TICKETER: { icon: <Ticket className="h-6 w-6" />, color: 'text-blue-600', desc: 'Search routes, select seats, create bookings', email: 'alice@bustrack.com' },
  CASHIER: { icon: <CreditCard className="h-6 w-6" />, color: 'text-emerald-600', desc: 'Process payments for pending bookings', email: 'bob@bustrack.com' },
  GATEMAN: { icon: <ShieldCheck className="h-6 w-6" />, color: 'text-amber-600', desc: 'Validate tickets and manage boarding', email: 'charles@bustrack.com' },
  MANAGER: { icon: <BarChart3 className="h-6 w-6" />, color: 'text-purple-600', desc: 'View dashboard stats and operations', email: 'diana@bustrack.com' },
  SUPERADMIN: { icon: <Settings className="h-6 w-6" />, color: 'text-red-600', desc: 'Full system management and analytics', email: 'edward@bustrack.com' },
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  BOARDING: 'bg-amber-100 text-amber-700',
  DEPARTED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DELAYED: 'bg-orange-100 text-orange-700',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  BOARDED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
  VALID: 'bg-green-100 text-green-700',
  INVALID: 'bg-red-100 text-red-700',
  WRONG_GATE: 'bg-amber-100 text-amber-700',
  ALREADY_BOARDED: 'bg-orange-100 text-orange-700',
};

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  MOBILE_MONEY: <Smartphone className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  QR_CODE: <QrCode className="h-4 w-4" />,
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Home() {
  const { toast } = useToast();

  // ─── Auth State ──────────────────────────────────────────────────────
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // ─── Shared State ────────────────────────────────────────────────────
  const schedulePollRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setLoginEmail('');
    setLoginError('');
    if (schedulePollRef.current) clearInterval(schedulePollRef.current);
  }, []);

  const quickLogin = useCallback(async (email: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password' }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        toast({ title: `Welcome, ${data.user.name}!`, description: `Logged in as ${data.user.role}` });
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error');
    } finally {
      setLoginLoading(false);
    }
  }, [toast]);

  const handleLogin = useCallback(async () => {
    if (!loginEmail) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: 'password' }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        toast({ title: `Welcome back!`, description: `Logged in as ${data.user.name}` });
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error');
    } finally {
      setLoginLoading(false);
    }
  }, [loginEmail, toast]);

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
              <Bus className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">BusTrack</h1>
            <p className="text-muted-foreground mt-2">Bus Station Ticket Booking System</p>
          </div>

          {/* Login Card */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription>Enter your email to access the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="flex-1"
                />
                <Button onClick={handleLogin} disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
                </Button>
              </div>
              {loginError && (
                <p className="text-sm text-destructive mt-2">{loginError}</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Demo */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">
              Quick Demo — Click a role to enter
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
                <motion.div
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30"
                    onClick={() => quickLogin(config.email)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted mb-2 ${config.color}`}>
                        {config.icon}
                      </div>
                      <h3 className="font-semibold text-sm">{role.charAt(0) + role.slice(1).toLowerCase()}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{config.desc}</p>
                      <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs gap-1">
                        Enter <ChevronRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── ROLE ROUTING ────────────────────────────────────────────────────
  switch (user.role) {
    case 'TICKETER':
      return <TicketerInterface user={user} onLogout={logout} toast={toast} />;
    case 'CASHIER':
      return <CashierInterface user={user} onLogout={logout} toast={toast} />;
    case 'GATEMAN':
      return <GatemanInterface user={user} onLogout={logout} toast={toast} />;
    case 'MANAGER':
      return <ManagerInterface user={user} onLogout={logout} toast={toast} />;
    case 'SUPERADMIN':
      return <SuperadminInterface user={user} onLogout={logout} toast={toast} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TICKETER INTERFACE
// ═══════════════════════════════════════════════════════════════════════
function TicketerInterface({ user, onLogout, toast }: { user: StaffUser; onLogout: () => void; toast: any }) {
  const [search, setSearch] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleDetail, setScheduleDetail] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      const q = searchTerm !== undefined ? searchTerm : search;
      const url = q ? `/api/routes?search=${q}` : '/api/routes';
      const res = await fetch(url);
      const data = await res.json();
      const allSchedules: ScheduleItem[] = [];
      data.routes?.forEach((route: any) => {
        route.schedules?.forEach((s: any) => {
          allSchedules.push({
            id: s.id,
            routeName: `${route.origin} → ${route.destination}`,
            routeId: route.id,
            busPlate: s.bus.plateNumber,
            busType: s.bus.busType,
            totalSeats: s.bus.totalSeats,
            bookedCount: s._count.bookings,
            departureTime: s.departureTime,
            fare: s.fare,
            status: s.status,
            gateNumber: s.gateNumber,
          });
        });
      });
      setSchedules(allSchedules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchSchedules(val);
  };

  const selectSchedule = async (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    setSelectedSeat(null);
    setPassengerName('');
    setPassengerPhone('');
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`);
      const data = await res.json();
      setScheduleDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    if (!selectedSchedule || !selectedSeat || !passengerName || !passengerPhone) return;
    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          staffId: user.id,
          passengerName,
          passengerPhone,
          seatNumber: selectedSeat,
          fare: selectedSchedule.fare,
        }),
      });
      const data = await res.json();
      if (data.booking) {
        toast({
          title: 'Booking Created!',
          description: `Ref: ${data.booking.reference} — Seat ${selectedSeat}. Awaiting payment.`,
        });
        setSelectedSeat(null);
        setPassengerName('');
        setPassengerPhone('');
        selectSchedule(selectedSchedule);
        fetchSchedules();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setBookingLoading(false);
    }
  };

  const popularRoutes = ['Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Bus className="h-4 w-4" />
          </div>
          <span className="font-semibold">Ticketer: {user.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Routes */}
        <aside className="w-80 border-r flex flex-col bg-card shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {popularRoutes.map((r) => (
                <Button key={r} variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSearch(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No schedules found</p>
            ) : (
              schedules.map((s) => (
                <Card
                  key={s.id}
                  className={`cursor-pointer hover:shadow-sm transition-all p-3 ${selectedSchedule?.id === s.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => selectSchedule(s)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{s.routeName}</p>
                      <p className="text-xs text-muted-foreground">{s.busPlate} · {s.busType}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[s.status] || ''}>{s.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.departureTime}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.bookedCount}/{s.totalSeats}</span>
                    <span className="font-semibold text-foreground">KES {s.fare.toLocaleString()}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </aside>

        {/* Center Panel - Seat Map */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedSchedule && scheduleDetail ? (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedSchedule.routeName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSchedule.busPlate} · Gate {selectedSchedule.gateNumber || 'TBD'} · {selectedSchedule.departureTime}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border bg-white" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-300" /> Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-primary" /> Selected</span>
                </div>
              </div>

              {/* Bus Visualization */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 max-w-md w-full shadow-sm">
                  {/* Driver area */}
                  <div className="flex justify-end mb-4 pr-2">
                    <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      DRIVER
                    </div>
                  </div>

                  {/* Seat Grid */}
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${scheduleDetail.bus.cols}, 1fr)`,
                      maxWidth: scheduleDetail.bus.cols * 64 + (scheduleDetail.bus.cols - 1) * 8,
                      margin: '0 auto',
                    }}
                  >
                    {Array.from({ length: scheduleDetail.bus.rows * scheduleDetail.bus.cols }).map((_, idx) => {
                      const row = Math.floor(idx / scheduleDetail.bus.cols) + 1;
                      const colIdx = idx % scheduleDetail.bus.cols;
                      const colLetter = String.fromCharCode(65 + colIdx);
                      const seatNum = `${row}${colLetter}`;
                      const booked = scheduleDetail.bookedSeats?.find((b: any) => b.seatNumber === seatNum);
                      const isSelected = selectedSeat === seatNum;
                      const isOccupied = !!booked;

                      // Skip aisle seat if 4 cols (skip index 2 for center aisle)
                      // Actually let's just render all seats

                      return (
                        <motion.button
                          key={seatNum}
                          whileHover={!isOccupied ? { scale: 1.08 } : {}}
                          whileTap={!isOccupied ? { scale: 0.95 } : {}}
                          className={`
                            relative w-14 h-12 rounded-lg border-2 text-xs font-medium
                            flex flex-col items-center justify-center transition-all
                            ${isOccupied
                              ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                : 'bg-white border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                            }
                          `}
                          disabled={isOccupied}
                          onClick={() => setSelectedSeat(isSelected ? null : seatNum)}
                          title={booked ? `${booked.passengerName}` : seatNum}
                        >
                          <span className="text-[10px] opacity-70">{row}</span>
                          <span className="font-bold">{colLetter}</span>
                          {isOccupied && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[8px]">
                              ✕
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    {scheduleDetail.availableSeats} of {scheduleDetail.bus.totalSeats} seats available
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Bus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a schedule to view seats</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel - Booking Form */}
        <aside className="w-80 border-l flex flex-col bg-card shrink-0">
          {selectedSchedule && scheduleDetail ? (
            <div className="p-4 flex flex-col h-full">
              <h3 className="font-semibold mb-4">New Booking</h3>

              {selectedSeat ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected Seat</span>
                      <Badge className="bg-primary text-primary-foreground">{selectedSeat}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{selectedSchedule.routeName}</p>
                    <p className="text-lg font-bold mt-1">KES {selectedSchedule.fare.toLocaleString()}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-muted rounded-xl p-4 mb-4 text-center text-sm text-muted-foreground">
                  <Ticket className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  Click a seat to select it
                </div>
              )}

              <div className="space-y-3 flex-1">
                <div>
                  <Label className="text-xs">Passenger Name</Label>
                  <Input
                    placeholder="Full name"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    placeholder="+254..."
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                className="w-full mt-4"
                disabled={!selectedSeat || !passengerName || !passengerPhone || bookingLoading}
                onClick={handleBook}
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Ticket className="h-4 w-4 mr-2" /> Confirm Booking
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="p-4 flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
              Select a schedule first
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CASHIER INTERFACE
// ═══════════════════════════════════════════════════════════════════════
function CashierInterface({ user, onLogout, toast }: { user: StaffUser; onLogout: () => void; toast: any }) {
  const [pendingBookings, setPendingBookings] = useState<BookingItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState<BookingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/payments/recent'),
      ]);
      const bookingsData = await bookingsRes.json();
      const paymentsData = await paymentsRes.json();
      setPendingBookings(bookingsData.bookings || []);
      setRecentPayments(paymentsData.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const todayTotal = recentPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

  const openPayment = (booking: BookingItem) => {
    setPayingBooking(booking);
    setPaymentMethod('CASH');
    setCashReceived('');
    setDialogOpen(true);
  };

  const processPayment = async () => {
    if (!payingBooking) return;
    setProcessing(true);
    try {
      const amount = payingBooking.fare;
      const cashR = paymentMethod === 'CASH' ? parseFloat(cashReceived) || 0 : null;
      const change = cashR ? cashR - amount : null;

      if (paymentMethod === 'CASH' && cashR < amount) {
        toast({ title: 'Insufficient cash', description: 'Amount received is less than fare', variant: 'destructive' });
        setProcessing(false);
        return;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: payingBooking.id,
          staffId: user.id,
          amount,
          method: paymentMethod,
          cashReceived: cashR,
          changeGiven: change,
        }),
      });
      const data = await res.json();
      if (data.payment) {
        toast({
          title: 'Payment Complete! ✅',
          description: `${payingBooking.reference} — KES ${amount.toLocaleString()} via ${paymentMethod}${change ? ` (Change: KES ${change.toLocaleString()})` : ''}`,
        });
        setDialogOpen(false);
        fetchData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const change = cashReceived ? parseFloat(cashReceived) - (payingBooking?.fare || 0) : 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-semibold">Cashier: {user.name}</span>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 ml-2">
            Today: KES {todayTotal.toLocaleString()}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main - Pending Bookings */}
        <main className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Pending Payments
            <Badge variant="secondary" className="ml-1">{pendingBookings.length}</Badge>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>All caught up! No pending payments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingBookings.map((b) => (
                <Card key={b.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-mono text-sm font-bold">{b.reference}</p>
                        <p className="text-sm font-medium">{b.passengerName}</p>
                        <p className="text-xs text-muted-foreground">{b.passengerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">KES {b.fare.toLocaleString()}</p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                      <span>{b.schedule.route.origin} → {b.schedule.route.destination}</span>
                      <span>Seat {b.seatNumber} · {b.schedule.departureTime}</span>
                    </div>
                    <Button size="sm" className="w-full" onClick={() => openPayment(b)}>
                      <Wallet className="h-4 w-4 mr-2" /> Process Payment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Right - Recent Transactions */}
        <aside className="w-80 border-l bg-card p-4 overflow-y-auto shrink-0">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Transactions
          </h3>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              recentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    {PAYMENT_METHOD_ICONS[p.method]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.booking?.schedule?.route?.origin} → {p.booking?.schedule?.route?.destination}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-sm font-semibold">KES {p.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {payingBooking?.reference} — {payingBooking?.passengerName}
            </DialogDescription>
          </DialogHeader>

          {/* Amount Display */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-4xl font-bold text-primary">
              KES {payingBooking?.fare.toLocaleString()}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['CASH', 'MOBILE_MONEY', 'CARD', 'QR_CODE'] as const).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  className="justify-start gap-2 h-11"
                  onClick={() => setPaymentMethod(method)}
                >
                  {PAYMENT_METHOD_ICONS[method]}
                  <span className="text-xs">{method.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Cash Calculator */}
          {paymentMethod === 'CASH' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <Separator />
              <Label className="text-xs font-medium">Cash Received</Label>
              <Input
                type="number"
                placeholder="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="text-xl font-bold text-center h-14"
                autoFocus
              />
              {/* Quick cash buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[100, 200, 500, 1000, 1500, 2000, 3000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setCashReceived(String(amt))}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
              {parseFloat(cashReceived) >= (payingBooking?.fare || 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"
                >
                  <p className="text-xs text-emerald-600">Change to Give</p>
                  <p className="text-2xl font-bold text-emerald-700">KES {change.toLocaleString()}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={processPayment} disabled={processing || (paymentMethod === 'CASH' && parseFloat(cashReceived) < (payingBooking?.fare || 0))}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GATEMAN INTERFACE
// ═══════════════════════════════════════════════════════════════════════
function GatemanInterface({ user, onLogout, toast }: { user: StaffUser; onLogout: () => void; toast: any }) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [reference, setReference] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [boardingInfo, setBoardingInfo] = useState<any>(null);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules/today');
      const data = await res.json();
      const boardingSchedules = (data.schedules || []).filter((s: ScheduleItem) =>
        ['SCHEDULED', 'BOARDING', 'DELAYED'].includes(s.status)
      );
      setSchedules(boardingSchedules);
      if (boardingSchedules.length > 0 && !selectedSchedule) {
        const boarding = boardingSchedules.find((s: ScheduleItem) => s.status === 'BOARDING') || boardingSchedules[0];
        setSelectedSchedule(boarding);
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

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      fetchBoardingInfo();
      const interval = setInterval(fetchBoardingInfo, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSchedule, fetchBoardingInfo]);

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
        toast({ title: 'Valid Ticket ✅', description: `${data.passengerName} — Seat ${data.seatNumber}` });
        fetchBoardingInfo();
      }
    } catch {
      setValidationResult({ result: 'INVALID', reason: 'Network error' });
    } finally {
      setValidating(false);
      setReference('');
      inputRef?.focus();
    }
  };

  const resultConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
    VALID: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <Check className="h-16 w-16" />, border: 'border-emerald-300' },
    INVALID: { bg: 'bg-red-50', text: 'text-red-700', icon: <X className="h-16 w-16" />, border: 'border-red-300' },
    WRONG_GATE: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertTriangle className="h-16 w-16" />, border: 'border-amber-300' },
    ALREADY_BOARDED: { bg: 'bg-orange-50', text: 'text-orange-700', icon: <AlertTriangle className="h-16 w-16" />, border: 'border-orange-300' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <X className="h-16 w-16" />, border: 'border-gray-300' },
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top - Bus Info */}
      <header className="bg-primary text-primary-foreground px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedSchedule?.routeName || 'Select a Bus'}</h1>
              <div className="flex items-center gap-4 text-sm opacity-90 mt-1">
                {selectedSchedule && (
                  <>
                    <span className="flex items-center gap-1"><Car className="h-4 w-4" /> {selectedSchedule.busPlate}</span>
                    <span className="flex items-center gap-1"><DoorOpen className="h-4 w-4" /> Gate {selectedSchedule.gateNumber || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedSchedule.departureTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {schedules.length > 1 && (
              <Select value={selectedSchedule?.id || ''} onValueChange={(v) => {
                const s = schedules.find(s => s.id === v);
                if (s) {
                  setSelectedSchedule(s);
                  setValidationResult(null);
                }
              }}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.routeName} - {s.departureTime}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-white hover:bg-white/10 gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center - Scanner */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-xl">
            <div className="flex gap-2 mb-6">
              <Input
                ref={setInputRef}
                placeholder="Scan or type booking reference..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                className="h-16 text-2xl font-mono text-center tracking-widest"
                autoFocus
              />
              <Button
                size="lg"
                className="h-16 px-8 text-lg"
                onClick={handleValidate}
                disabled={validating || !reference.trim()}
              >
                {validating ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <><ShieldCheck className="h-6 w-6 mr-2" /> Validate</>
                )}
              </Button>
            </div>

            {/* Result Display */}
            <AnimatePresence mode="wait">
              {validationResult && (
                <motion.div
                  key={validationResult.result}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`
                    rounded-2xl border-2 p-8 text-center ${resultConfig[validationResult.result]?.bg || 'bg-gray-50'}
                    ${resultConfig[validationResult.result]?.border || 'border-gray-300'}
                  `}
                >
                  <div className={`flex justify-center mb-4 ${resultConfig[validationResult.result]?.text || ''}`}>
                    {resultConfig[validationResult.result]?.icon}
                  </div>
                  <h2 className={`text-3xl font-bold ${resultConfig[validationResult.result]?.text || ''}`}>
                    {validationResult.result}
                  </h2>
                  {validationResult.result === 'VALID' && (
                    <div className="mt-3 space-y-1">
                      <p className="text-lg font-semibold text-foreground">{validationResult.passengerName}</p>
                      <p className="text-xl font-bold text-primary">Seat {validationResult.seatNumber}</p>
                      <p className="text-sm text-muted-foreground font-mono">{validationResult.reference}</p>
                    </div>
                  )}
                  {validationResult.reason && validationResult.result !== 'VALID' && (
                    <p className="mt-2 text-sm opacity-80">{validationResult.reason}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!validationResult && (
              <div className="text-center text-muted-foreground mt-8">
                <QrCode className="h-16 w-16 mx-auto mb-3 opacity-20" />
                <p className="text-lg">Waiting for scan...</p>
                <p className="text-sm">Scan a ticket QR code or type the reference manually</p>
              </div>
            )}
          </div>
        </main>

        {/* Right - Boarding Progress */}
        <aside className="w-72 border-l bg-card p-4 overflow-y-auto shrink-0">
          <h3 className="font-semibold text-sm mb-3">Boarding Progress</h3>
          {boardingInfo && (
            <>
              <div className="text-center mb-4">
                <div className="relative inline-flex items-center justify-center w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
                    <circle
                      cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none"
                      className="text-primary"
                      strokeDasharray={`${(boardingInfo.boardedCount / Math.max(boardingInfo.totalActive, 1)) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-bold">{boardingInfo.boardedCount}</p>
                    <p className="text-[10px] text-muted-foreground">/{boardingInfo.totalActive}</p>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2">
                  {Math.round((boardingInfo.boardedCount / Math.max(boardingInfo.totalActive, 1)) * 100)}% Boarded
                </p>
              </div>

              <Separator className="my-3" />

              <h4 className="text-xs font-medium text-muted-foreground mb-2">Boarded Passengers</h4>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {boardingInfo.boarded.map((b: any, i: number) => (
                  <div key={b.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{b.passengerName}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{b.seatNumber}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MANAGER INTERFACE
// ═══════════════════════════════════════════════════════════════════════
function ManagerInterface({ user, onLogout, toast }: { user: StaffUser; onLogout: () => void; toast: any }) {
  const [stats, setStats] = useState<any>(null);
  const [departures, setDepartures] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, depRes, staffRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/departures'),
        fetch('/api/admin/staff'),
      ]);
      setStats(await statsRes.json());
      const depData = await depRes.json();
      setDepartures(depData.departures || []);
      const staffData = await staffRes.json();
      setStaffList(staffData.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const kpis = stats ? [
    {
      label: 'Revenue', value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-50', change: '+12%'
    },
    {
      label: 'Passengers', value: stats.totalPassengers || 0, icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50', change: '+8%'
    },
    {
      label: 'Buses Departed', value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`, icon: <Bus className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-50', change: 'On Track'
    },
    {
      label: 'On-Time Rate', value: `${stats.onTimeRate || 0}%`, icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-50', change: 'vs 94% yesterday'
    },
  ] : [];

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="font-semibold">Manager: {user.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{kpi.label}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                      </div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Departure Board */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Live Departure Board
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Gate</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departures.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.routeName}</TableCell>
                      <TableCell>
                        <span className="text-xs">{d.busPlate}</span>
                        <Badge variant="outline" className="ml-1 text-[10px]">{d.busType}</Badge>
                      </TableCell>
                      <TableCell>{d.gateNumber || '—'}</TableCell>
                      <TableCell className="font-mono">{d.departureTime}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[d.status] || ''}>{d.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={d.occupancy} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">{d.occupancy}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">High Demand Alert</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Route Nairobi → Mombasa is showing {stats?.bookingsByRoute?.[0]?.count || 0} bookings today.
                    Consider adding an extra bus for the 11:00 slot.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Revenue Trending Up</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today&apos;s revenue is tracking 12% above yesterday at the same time. Payment processing is smooth.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Right - Staff Activity */}
        <aside className="w-64 border-l bg-card p-4 overflow-y-auto shrink-0">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Staff Activity
          </h3>
          <div className="space-y-2">
            {staffList.filter((s: any) => s.active).map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {s.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <Badge variant="outline" className="text-[10px] h-4">{s.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUPERADMIN INTERFACE
// ═══════════════════════════════════════════════════════════════════════
function SuperadminInterface({ user, onLogout, toast }: { user: StaffUser; onLogout: () => void; toast: any }) {
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
  }, [fetchAll]);

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
    { label: 'Revenue', value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Passengers', value: stats.totalPassengers || 0, icon: <Users className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Buses', value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`, icon: <Bus className="h-5 w-5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'On-Time', value: `${stats.onTimeRate || 0}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
  ] : [];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'routes', label: 'Routes', icon: <Route className="h-4 w-4" /> },
    { id: 'buses', label: 'Buses', icon: <Car className="h-4 w-4" /> },
    { id: 'staff', label: 'Staff', icon: <UserCog className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
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
          <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start gap-2 text-xs h-8 mt-1">
            <LogOut className="h-3 w-3" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
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
                        <p className="text-2xl font-bold">{kpi.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Today&apos;s Departures</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Bus</TableHead>
                          <TableHead>Gate</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Occupancy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departures.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.routeName}</TableCell>
                            <TableCell>{d.busPlate}</TableCell>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Base Fare</TableHead>
                      <TableHead>Est. Time</TableHead>
                      <TableHead>Schedules</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> {r.origin}</TableCell>
                        <TableCell className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" /> {r.destination}</TableCell>
                        <TableCell>{r.distanceKm} km</TableCell>
                        <TableCell>KES {r.baseFare.toLocaleString()}</TableCell>
                        <TableCell>{r.estimatedMin} min</TableCell>
                        <TableCell><Badge variant="secondary">{r._count?.schedules || 0}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={addRouteOpen} onOpenChange={setAddRouteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Route</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Seats</TableHead>
                      <TableHead>Layout</TableHead>
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
                        <TableCell>{b.rows} × {b.cols}</TableCell>
                        <TableCell><Badge variant="secondary">{b._count?.schedules || 0}</Badge></TableCell>
                        <TableCell>
                          <Badge className={b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                            {b.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={addBusOpen} onOpenChange={setAddBusOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Bus</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                        <TableCell><Badge variant="outline">{s.role}</Badge></TableCell>
                        <TableCell className="text-sm">{s.phone || '—'}</TableCell>
                        <TableCell>{s._count?.bookings || 0}</TableCell>
                        <TableCell>
                          <Badge className={s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                            {s.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                {/* Revenue Bar Chart */}
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
                          <RTooltip
                            formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Bar dataKey="revenue" fill="oklch(0.55 0.2 260)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                        No data yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Occupancy Pie Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Passengers by Route</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                            label={({ name, percentage }) => `${name.split('→')[1]?.trim() || name} ${percentage}%`}
                          >
                            {analytics.seatOccupancy.map((_: any, index: number) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                        No data yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}