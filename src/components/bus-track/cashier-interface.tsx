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
  { key: 'MOBILE_MONEY', label: 'M-Pesa', icon: Smartphone },
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
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const fareAmount = payingBooking?.fare || 0;
  const changeAmount = cashReceived > 0 ? cashReceivedNum - fareAmount : 0;
  const canCompleteCash = paymentMethod === 'CASH' ? cashReceivedNum >= fareAmount : true;

  /* ─── Actions ─────────────────────────────────────────────── */
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
        toast.success(`${payingBooking.reference} — KES ${amount.toLocaleString()} via ${paymentMethod.replace('_', ' ')}${change ? ` · Change: KES ${change.toLocaleString()}` : ''}`);
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
    <div className="h-full flex flex-col">
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* ─── Main content ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* KPI Bar */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Today&apos;s Revenue
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    KES {todayTotal.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40"
                >
                  {pendingBookings.length} pending
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Pending payments grid */}
            <div className="flex-1 overflow-y-auto p-6 bt-scroll">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[152px] w-full rounded-xl" />
                  ))}
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-bt-fade-in">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending payments right now</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBookings.map((booking, i) => (
                    <div
                      key={booking.id}
                      className={`animate-bt-fade-in ${STAGGER_DELAYS[i % STAGGER_DELAYS.length]} border border-border/60 bg-card rounded-xl p-5 flex flex-col gap-3.5 hover:border-border transition-colors`}
                    >
                      {/* Top row: ref + fare */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
                            {booking.reference}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {booking.passengerName}
                          </span>
                          <span className="text-xs text-muted-foreground">{booking.passengerPhone}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-xl font-bold tracking-tight text-foreground">
                            KES {booking.fare.toLocaleString()}
                          </span>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[booking.status] || 'bg-muted text-muted-foreground'}`}
                          >
                            {booking.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <Separator className="bg-border/60" />

                      {/* Route info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                          <span className="truncate font-medium">
                            {booking.schedule.route.origin}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          <span className="truncate font-medium">
                            {booking.schedule.route.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
                          <span className="font-medium">Seat {booking.seatNumber}</span>
                          <span className="w-px h-3 bg-border" />
                          <span>{booking.schedule.departureTime}</span>
                        </div>
                      </div>

                      {/* Pay button */}
                      <Button
                        size="sm"
                        className="w-full mt-auto h-9 text-sm font-medium"
                        onClick={() => openPayment(booking)}
                      >
                        <Wallet className="h-3.5 w-3.5 mr-1.5" />
                        Process Payment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Sidebar: Recent Activity ─────────────────────── */}
          <aside className="hidden md:flex flex-col w-72 border-l border-border bg-card/50 shrink-0">
            <div className="px-5 py-4 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Activity
              </p>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto bt-scroll">
              {recentPayments.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-xs text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentPayments.map((p: any, i: number) => (
                    <div
                      key={p.id}
                      className="animate-bt-fade-in flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {/* Method icon */}
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        {PAYMENT_METHOD_ICONS[p.method] || <Banknote className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-px">
                        <span className="text-xs font-medium text-foreground truncate">
                          {p.booking?.schedule?.route?.origin} → {p.booking?.schedule?.route?.destination}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(p.createdAt)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                        {p.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ─── Payment Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden rounded-xl border border-border/60 bg-card [&>button]:hidden">
          {payingBooking && dialogOpen && (
            <div className="flex flex-col animate-bt-scale-in">
              {/* Dialog header */}
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-5">
                  <DialogHeader className="space-y-0 gap-1">
                    <DialogTitle className="text-base font-semibold text-foreground">
                      Process Payment
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {payingBooking.reference} · {payingBooking.passengerName}
                    </DialogDescription>
                  </DialogHeader>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Amount due */}
                <div className="flex flex-col items-center py-5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Amount Due
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    KES {payingBooking.fare.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground mt-2">
                    {payingBooking.schedule.route.origin} → {payingBooking.schedule.route.destination}
                  </span>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Payment method selector */}
              <div className="px-6 pt-5 pb-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                  Payment Method
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isActive = paymentMethod === method.key;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        className={`
                          flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg
                          border transition-all duration-150 cursor-pointer
                          ${isActive
                            ? 'border-primary/30 bg-primary/5 text-primary'
                            : 'border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[11px] font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash calculator (only for CASH) */}
              {paymentMethod === 'CASH' && (
                <div>
                  <Separator className="bg-border/60" />
                  <div className="px-6 pt-5 pb-4 space-y-4">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Cash Received
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                        KES
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="h-12 pl-12 text-right text-lg font-semibold tabular-nums bg-transparent border-border/60 focus-visible:ring-ring/30 rounded-lg"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCashReceived(String(amt))}
                          className={`
                            h-9 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer border
                            ${cashReceived === String(amt)
                              ? 'border-primary/30 bg-primary/5 text-primary'
                              : 'border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }
                          `}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Change display */}
                    {cashReceivedNum >= fareAmount && cashReceivedNum > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30 px-4 py-3 animate-bt-fade-in">
                        <span className="text-xs font-medium text-muted-foreground">Change</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          KES {changeAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Insufficient warning */}
                    {cashReceivedNum > 0 && cashReceivedNum < fareAmount && (
                      <p className="text-xs text-destructive text-center animate-bt-fade-in">
                        Insufficient amount
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-border/60" />

              {/* Footer */}
              <DialogFooter className="px-6 py-4 flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-9 text-sm font-medium border-border/60 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={processing || !canCompleteCash}
                  className="flex-1 h-9 text-sm font-medium rounded-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Processing
                    </>
                  ) : (
                    'Complete Payment'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}