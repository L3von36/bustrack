'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  QrCode,
  X,
  TrendingUp,
  Users,
  Hash,
  CircleDollarSign,
  Receipt,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AppHeader } from './app-header';
import { PAYMENT_METHOD_ICONS, STATUS_COLORS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser, BookingItem } from './types';

/* ─── Payment method config ─────────────────────────────────── */
const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'MOBILE_MONEY', label: 'Telebirr', icon: Smartphone },
  { key: 'CARD', label: 'Card', icon: CreditCard },
  { key: 'QR_CODE', label: 'QR', icon: QrCode },
] as const;

const QUICK_AMOUNTS = [100, 200, 500, 1000, 1500, 2000, 3000, 5000] as const;

const STAGGER_DELAYS = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600'];

/* ─── Props ─────────────────────────────────────────────────── */
interface CashierInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

/* ─── Helper: get initials from name ────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ─── Helper: generate a consistent pastel color from string ── */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Helper: get method color for activity feed ────────────── */
function getMethodColor(method: string): string {
  switch (method) {
    case 'CASH':
      return 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'MOBILE_MONEY':
      return 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400';
    case 'CARD':
      return 'bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400';
    case 'QR_CODE':
      return 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
    default:
      return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400';
  }
}

/* ─── Component ─────────────────────────────────────────────── */
export function CashierInterface({ user, onLogout, toast }: CashierInterfaceProps) {
  const { isConnected, emit, on } = useRealtimeSocket();

  /* State */
  const [pendingBookings, setPendingBookings] = useState<BookingItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState<BookingItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrWaiting, setTelebirrWaiting] = useState(false);
  const [telebirrSuccess, setTelebirrSuccess] = useState(false);

  /* ─── Data fetching ──────────────────────────────────────── */
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

  /* Real-time: new booking notification */
  useEffect(() => {
    const off = on('dashboard:booking-created', () => {
      fetchData();
    });
    return off;
  }, [on, fetchData]);

  /* ─── Derived ─────────────────────────────────────────────── */
  const todayTotal = recentPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const paymentCount = recentPayments.length;
  const averageFare = paymentCount > 0 ? Math.round(todayTotal / paymentCount) : 0;
  const pendingCount = pendingBookings.length;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const fareAmount = payingBooking?.fare || 0;
  const changeAmount = cashReceived > 0 ? cashReceivedNum - fareAmount : 0;
  const canCompleteCash = paymentMethod === 'CASH' ? cashReceivedNum >= fareAmount : true;

  /* ─── Actions ─────────────────────────────────────────────── */
  const openPayment = (booking: BookingItem) => {
    setPayingBooking(booking);
    setPaymentMethod('CASH');
    setCashReceived('');
    setTelebirrPhone('');
    setTelebirrWaiting(false);
    setTelebirrSuccess(false);
    setDialogOpen(true);
  };

  /* ─── Telebirr payment handler ───────────────────────────── */
  const handleTelebirrPayment = async () => {
    if (!payingBooking || !telebirrPhone.trim()) return;
    setTelebirrWaiting(true);
    setTelebirrSuccess(false);
    // Simulate 2-second wait for Telebirr confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTelebirrWaiting(false);
    setTelebirrSuccess(true);
    toast.success(`Telebirr payment of ETB ${payingBooking.fare.toLocaleString()} received`);
    // Auto-complete after brief display
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Proceed with the normal payment flow
    setPaymentMethod('MOBILE_MONEY');
    processPayment();
  };

  const processPayment = async () => {
    if (!payingBooking) return;
    setProcessing(true);
    try {
      const amount = payingBooking.fare;
      const cashR = paymentMethod === 'CASH' ? parseFloat(cashReceived) || 0 : null;
      const change = cashR ? cashR - amount : null;

      if (paymentMethod === 'CASH' && cashR < amount) {
        toast.error('Insufficient cash — amount received is less than fare');
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
        toast.success(`${payingBooking.reference} — ETB ${amount.toLocaleString()} via ${paymentMethod.replace('_', ' ')}${change ? ` · Change: ETB ${change.toLocaleString()}` : ''}`);
        emit('payment:completed', {
          bookingRef: payingBooking.reference,
          amount,
          method: paymentMethod,
          passengerName: payingBooking.passengerName,
          routeName: `${payingBooking.schedule.route.origin} → ${payingBooking.schedule.route.destination}`,
        });
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  /* ─── Time formatter ──────────────────────────────────────── */
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col bg-background">
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* ─── Main content area ────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* ═══ REVENUE HERO SECTION ═══ */}
            <section className="relative overflow-hidden">
              {/* Subtle gradient backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-emerald-500/[0.02] to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

              <div className="relative px-6 pt-8 pb-6 lg:px-10">
                <div className="animate-bt-fade-in">
                  {/* Station badge + title */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Payment Terminal
                      </span>
                    </div>
                    {user.station && (
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium border-border/60">
                        {user.station.name}, {user.station.city}
                      </Badge>
                    )}
                  </div>

                  {/* Big revenue number */}
                  <div className="flex flex-col gap-1 mb-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Today&apos;s Revenue
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-none">
                        ETB {todayTotal.toLocaleString()}
                      </span>
                      <TrendingUp className="h-6 w-6 text-emerald-500 mt-1" />
                    </div>
                  </div>

                  {/* Stat chips row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/60 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-muted-foreground leading-none">
                          Payments
                        </span>
                        <span className="text-sm font-bold text-foreground leading-tight mt-0.5">
                          {paymentCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/60 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <CircleDollarSign className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-muted-foreground leading-none">
                          Avg Fare
                        </span>
                        <span className="text-sm font-bold text-foreground leading-tight mt-0.5">
                          ETB {averageFare.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/60 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-muted-foreground leading-none">
                          Pending
                        </span>
                        <span className={`text-sm font-bold leading-tight mt-0.5 ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {pendingCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* ═══ PENDING PAYMENTS QUEUE ═══ */}
            <section className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 lg:px-10 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Pending Payments
                  </h2>
                  {!loading && pendingBookings.length > 0 && (
                    <Badge className="rounded-full h-5 min-w-5 px-1.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-6 bt-scroll">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : pendingBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center animate-bt-fade-in">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center animate-bt-scale-in delay-300">
                        <span className="text-[10px] font-bold text-white">✓</span>
                      </div>
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1">
                      All caught up!
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      No pending payments right now. New bookings will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {pendingBookings.map((booking, i) => {
                      const initials = getInitials(booking.passengerName);
                      const avatarColor = getAvatarColor(booking.passengerName);

                      return (
                        <div
                          key={booking.id}
                          className={`
                            animate-bt-slide-up ${STAGGER_DELAYS[i % STAGGER_DELAYS.length]}
                            group relative flex items-center gap-4
                            bg-card border border-border/60 rounded-xl
                            px-5 py-4
                            hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]
                            transition-all duration-200 cursor-default
                          `}
                        >
                          {/* Left accent bar */}
                          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />

                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 font-bold text-sm`}>
                            {initials}
                          </div>

                          {/* Passenger info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {booking.passengerName}
                              </span>
                              <span className="font-mono text-[11px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                                {booking.reference}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                              <span className="truncate font-medium">
                                {booking.schedule.route.origin}
                              </span>
                              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                              <span className="truncate font-medium">
                                {booking.schedule.route.destination}
                              </span>
                              <span className="w-px h-3 bg-border shrink-0" />
                              <span className="font-medium shrink-0">
                                Seat {booking.seatNumber}
                              </span>
                              <span className="w-px h-3 bg-border shrink-0 hidden sm:block" />
                              <span className="font-medium shrink-0 hidden sm:inline">
                                {booking.schedule.departureTime}
                              </span>
                            </div>
                          </div>

                          {/* Fare + Action */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-lg font-bold text-foreground tabular-nums leading-none">
                                ETB {booking.fare.toLocaleString()}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="h-10 px-5 text-sm font-semibold rounded-lg gap-2"
                              onClick={() => openPayment(booking)}
                            >
                              <Wallet className="h-4 w-4" />
                              <span className="hidden sm:inline">Process</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ─── Right Sidebar: Recent Activity ───────────────── */}
          <aside className="hidden lg:flex flex-col w-80 border-l border-border bg-card/30 shrink-0">
            <div className="px-5 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Activity
                </h2>
              </div>
              {recentPayments.length > 0 && (
                <Badge variant="secondary" className="rounded-full text-[10px] font-medium px-2 py-0.5">
                  {recentPayments.length}
                </Badge>
              )}
            </div>
            <Separator />

            <div className="flex-1 overflow-y-auto bt-scroll">
              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                    <Inbox className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No transactions yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Processed payments will appear here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentPayments.map((p: any, i: number) => {
                    const methodColor = getMethodColor(p.method);

                    return (
                      <React.Fragment key={p.id}>
                        <div
                          className={`
                            animate-bt-fade-in flex items-start gap-3.5 px-5 py-3.5
                            hover:bg-muted/30 transition-colors
                          `}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          {/* Method icon in colored circle */}
                          <div className={`
                            w-10 h-10 rounded-xl ${methodColor} flex items-center justify-center shrink-0 mt-0.5
                            shadow-sm
                          `}>
                            {PAYMENT_METHOD_ICONS[p.method] || <Banknote className="h-4 w-4" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                            <span className="text-sm font-medium text-foreground truncate leading-tight">
                              {p.booking?.schedule?.route?.origin} → {p.booking?.schedule?.route?.destination}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-[11px] text-muted-foreground">
                                {formatTime(p.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex flex-col items-end shrink-0 pt-0.5">
                            <span className="text-sm font-bold text-foreground tabular-nums leading-tight">
                              ETB {p.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Completed
                            </span>
                          </div>
                        </div>
                        {i < recentPayments.length - 1 && (
                          <div className="mx-5 border-t border-border/40" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ─── Payment Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 [&>button]:hidden"
        >
          {payingBooking && dialogOpen && (
            <div className="flex flex-col animate-bt-scale-in">
              {/* ── Dialog header with gradient accent ── */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative px-7 pt-7 pb-0">
                  <div className="flex items-start justify-between mb-6">
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="text-lg font-bold text-foreground">
                        Process Payment
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground font-normal">
                        {payingBooking.reference} · {payingBooking.passengerName}
                      </DialogDescription>
                    </DialogHeader>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 -mt-1 -mr-1"
                      onClick={() => setDialogOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ── Big amount display ── */}
                  <div className="flex flex-col items-center py-7">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                      Amount Due
                    </span>
                    <span className="text-5xl font-extrabold tracking-tight text-foreground leading-none">
                      ETB {payingBooking.fare.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-muted/60">
                      <span className="text-xs font-medium text-muted-foreground">
                        {payingBooking.schedule.route.origin} → {payingBooking.schedule.route.destination}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Seat {payingBooking.seatNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* ── Payment method selector ── */}
              <div className="px-7 pt-6 pb-5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">
                  Payment Method
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isActive = paymentMethod === method.key;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        className={`
                          flex flex-col items-center justify-center gap-2.5 py-4 rounded-xl
                          border-2 transition-all duration-200 cursor-pointer
                          shadow-sm
                          ${isActive
                            ? 'border-emerald-500/40 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5'
                            : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground hover:shadow-md'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-500/15' : 'bg-muted/60'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Telebirr prompt (only for MOBILE_MONEY) ── */}
              {paymentMethod === 'MOBILE_MONEY' && (
                <div>
                  <Separator className="bg-border/50" />
                  <div className="px-7 pt-6 pb-5 space-y-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Telebirr Payment
                    </Label>

                    {/* Telebirr branding card */}
                    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/5 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">Telebirr</span>
                          <p className="text-[11px] text-muted-foreground">Mobile money payment</p>
                        </div>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        Enter the passenger&apos;s Telebirr number or scan QR code
                      </p>
                    </div>

                    {/* Telebirr phone input */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                        🇪🇹 +251
                      </span>
                      <Input
                        type="tel"
                        placeholder="0912 345 678"
                        value={telebirrPhone}
                        onChange={(e) => {
                          setTelebirrPhone(e.target.value);
                          setTelebirrSuccess(false);
                        }}
                        disabled={telebirrWaiting || telebirrSuccess}
                        className="h-14 pl-24 pr-4 text-lg font-semibold tabular-nums bg-card border-border/60 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 rounded-xl"
                      />
                    </div>

                    {/* Waiting state */}
                    {telebirrWaiting && (
                      <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 animate-bt-fade-in">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Waiting for payment…
                        </span>
                      </div>
                    )}

                    {/* Success state */}
                    {telebirrSuccess && (
                      <div className="flex items-center justify-center gap-2.5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 animate-bt-fade-in">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          Payment received! Processing…
                        </span>
                      </div>
                    )}

                    {/* Send Payment Request button */}
                    {!telebirrWaiting && !telebirrSuccess && (
                      <Button
                        onClick={handleTelebirrPayment}
                        disabled={!telebirrPhone.trim() || telebirrPhone.replace(/\s/g, '').length < 10}
                        className="w-full h-12 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow disabled:opacity-40 disabled:hover:shadow-none"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Send Payment Request
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Cash calculator (only for CASH) ── */}
              {paymentMethod === 'CASH' && (
                <div>
                  <Separator className="bg-border/50" />
                  <div className="px-7 pt-6 pb-5 space-y-5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Cash Received
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold pointer-events-none">
                        ETB
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="h-14 pl-14 pr-4 text-right text-2xl font-bold tabular-nums bg-card border-border/60 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 rounded-xl"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCashReceived(String(amt))}
                          className={`
                            h-12 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer border-2
                            shadow-sm
                            ${cashReceived === String(amt)
                              ? 'border-emerald-500/40 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5'
                              : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground hover:shadow-md'
                            }
                          `}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Change display - prominent green card */}
                    {cashReceivedNum >= fareAmount && cashReceivedNum > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/15 px-5 py-4 animate-bt-fade-in shadow-sm shadow-emerald-500/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Banknote className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">
                            Change Due
                          </span>
                        </div>
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ETB {changeAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Insufficient warning */}
                    {cashReceivedNum > 0 && cashReceivedNum < fareAmount && (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/5 border border-destructive/15 animate-bt-fade-in">
                        <span className="text-sm font-medium text-destructive">
                          Insufficient amount — need ETB {(fareAmount - cashReceivedNum).toLocaleString()} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* ── Footer with large buttons ── */}
              <DialogFooter className="px-7 py-5 flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-12 text-sm font-semibold border-border/60 rounded-xl hover:bg-muted/60"
                >
                  Cancel
                </Button>
                {paymentMethod !== 'MOBILE_MONEY' && (
                  <Button
                    onClick={processPayment}
                    disabled={processing || !canCompleteCash}
                    className="flex-1 h-12 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}