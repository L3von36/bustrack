'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { PAYMENT_METHOD_ICONS } from './constants';
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

/* ─── Props ─────────────────────────────────────────────────── */
interface CashierInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

/* ─── Animation variants ────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -4, transition: { duration: 0.2 } },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};

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
    <div className="h-screen flex flex-col bg-background">
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Main content ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Bar */}
          <div className="px-4 pt-4 pb-2 flex items-end justify-between gap-4">
            <div>
              <p className="btr-label text-muted-foreground mb-1">Today&apos;s Revenue</p>
              <p className="btr-kpi text-foreground">
                KES {todayTotal.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pb-1">
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border-0"
              >
                {pendingBookings.length} pending
              </Badge>
            </div>
          </div>

          <Separator className="mx-4 bg-border" />

          {/* Pending payments grid */}
          <div className="flex-1 overflow-y-auto p-4 btr-scroll">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[140px] w-full rounded-lg" />
                ))}
              </div>
            ) : pendingBookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">All caught up</p>
                <p className="text-xs text-zinc-600 mt-1">No pending payments right now</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {pendingBookings.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="btr-card p-4 flex flex-col gap-3 group"
                    >
                      {/* Top row: ref + fare */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[13px] font-semibold text-foreground tracking-tight">
                            {booking.reference}
                          </span>
                          <span className="text-[13px] font-medium text-foreground">
                            {booking.passengerName}
                          </span>
                          <span className="text-[11px] text-zinc-600">{booking.passengerPhone}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <span className="btr-kpi text-[1.25rem] text-foreground">
                            KES {booking.fare.toLocaleString()}
                          </span>
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2 py-0 text-[10px] font-medium bg-muted text-muted-foreground border-0"
                          >
                            {booking.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Route info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground min-w-0">
                          <span className="truncate">
                            {booking.schedule.route.origin}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-zinc-600" />
                          <span className="truncate">
                            {booking.schedule.route.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600 shrink-0 ml-2">
                          <span>Seat {booking.seatNumber}</span>
                          <span className="w-px h-3 bg-border" />
                          <span>{booking.schedule.departureTime}</span>
                        </div>
                      </div>

                      {/* Pay button */}
                      <Button
                        size="sm"
                        className="w-full mt-auto btr-press h-9 text-[13px] font-medium"
                        onClick={() => openPayment(booking)}
                      >
                        <Wallet className="h-3.5 w-3.5 mr-1.5" />
                        Process Payment
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* ─── Sidebar: Recent Activity ─────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 border-l border-border bg-card/50 shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="btr-label text-muted-foreground">Recent Activity</p>
            <Clock className="h-3.5 w-3.5 text-zinc-600" />
          </div>
          <Separator className="bg-border" />
          <div className="flex-1 overflow-y-auto btr-scroll">
            {recentPayments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[12px] text-zinc-600">No transactions yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {recentPayments.map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group"
                  >
                    {/* Method icon — muted circle, NO colored bg */}
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                      {PAYMENT_METHOD_ICONS[p.method] || <Banknote className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-px">
                      <span className="text-[12px] font-medium text-foreground truncate">
                        {p.booking?.schedule?.route?.origin} → {p.booking?.schedule?.route?.destination}
                      </span>
                      <span className="text-[11px] text-zinc-600">
                        {formatTime(p.createdAt)}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground tabular-nums shrink-0">
                      {p.amount.toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ─── Payment Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-lg border border-border bg-card [&>button]:hidden">
          <AnimatePresence mode="wait">
            {payingBooking && dialogOpen && (
              <motion.div
                key="payment-dialog"
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col"
              >
                {/* Dialog header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <DialogHeader className="space-y-0 gap-1">
                      <DialogTitle className="text-[15px] font-semibold text-foreground">
                        Process Payment
                      </DialogTitle>
                      <DialogDescription className="text-[12px] text-muted-foreground">
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
                  <div className="flex flex-col items-center py-4">
                    <span className="btr-label text-muted-foreground mb-2">Amount Due</span>
                    <span className="btr-kpi text-foreground">
                      KES {payingBooking.fare.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-zinc-600 mt-1.5">
                      {payingBooking.schedule.route.origin} → {payingBooking.schedule.route.destination}
                    </span>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Payment method selector */}
                <div className="px-5 pt-4 pb-3">
                  <Label className="btr-label text-muted-foreground mb-2.5 block">Payment Method</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const isActive = paymentMethod === method.key;
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.key}
                          onClick={() => setPaymentMethod(method.key)}
                          className={`
                            btr-press flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg
                            border transition-all duration-150 cursor-pointer
                            ${isActive
                              ? 'border-foreground/20 bg-foreground/[0.04] text-foreground'
                              : 'border-border bg-transparent text-muted-foreground hover:border-foreground/10 hover:text-foreground'
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
                <AnimatePresence mode="wait">
                  {paymentMethod === 'CASH' && (
                    <motion.div
                      key="cash-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <Separator className="bg-border" />
                      <div className="px-5 pt-4 pb-3 space-y-3">
                        <Label className="btr-label text-muted-foreground block">Cash Received</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-600 font-medium pointer-events-none">
                            KES
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="h-12 pl-12 text-right text-lg font-semibold tabular-nums bg-transparent border-border focus-visible:ring-ring/30"
                            autoFocus
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {QUICK_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setCashReceived(String(amt))}
                              className={`
                                btr-press h-8 rounded-md text-[12px] font-medium transition-all duration-100 cursor-pointer border
                                ${cashReceived === String(amt)
                                  ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
                                  : 'border-border bg-transparent text-muted-foreground hover:border-foreground/10 hover:text-foreground'
                                }
                              `}
                            >
                              {amt.toLocaleString()}
                            </button>
                          ))}
                        </div>

                        {/* Change display */}
                        <AnimatePresence mode="wait">
                          {cashReceivedNum >= fareAmount && cashReceivedNum > 0 && (
                            <motion.div
                              key="change-display"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3"
                            >
                              <span className="text-[12px] text-muted-foreground">Change</span>
                              <span className="text-[15px] font-semibold text-foreground tabular-nums">
                                KES {changeAmount.toLocaleString()}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Insufficient warning */}
                        <AnimatePresence mode="wait">
                          {cashReceivedNum > 0 && cashReceivedNum < fareAmount && (
                            <motion.p
                              key="insufficient"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-[12px] text-destructive text-center"
                            >
                              Insufficient amount
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator className="bg-border" />

                {/* Footer */}
                <DialogFooter className="px-5 py-4 flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 h-9 text-[13px] font-medium border-border btr-press"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={processPayment}
                    disabled={processing || !canCompleteCash}
                    className="flex-1 h-9 text-[13px] font-medium btr-press"
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
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}