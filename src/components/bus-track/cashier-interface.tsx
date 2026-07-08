'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Loader2, Check, Wallet, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AppHeader } from './app-header';
import { STATUS_COLORS, PAYMENT_METHOD_ICONS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser, BookingItem } from './types';

interface CashierInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

export function CashierInterface({ user, onLogout, toast }: CashierInterfaceProps) {
  const { isConnected, emit, on } = useRealtimeSocket();
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

  // Real-time: new booking notification
  useEffect(() => {
    const off = on('dashboard:booking-created', () => {
      fetchData();
    });
    return off;
  }, [on, fetchData]);

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
          title: 'Payment Complete!',
          description: `${payingBooking.reference} — KES ${amount.toLocaleString()} via ${paymentMethod}${change ? ` (Change: KES ${change.toLocaleString()})` : ''}`,
        });
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-screen flex flex-col bg-background"
    >
      <AppHeader user={user} onLogout={onLogout} iconBgColor="bg-emerald-600" isConnected={isConnected} />
      <div className="h-10 border-b flex items-center px-4 bg-card">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Today: KES {todayTotal.toLocaleString()}
        </Badge>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Main - Pending Bookings */}
        <main className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Pending Payments
            <Badge variant="secondary" className="ml-1">{pendingBookings.length}</Badge>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
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
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-card p-4 overflow-y-auto shrink-0 max-h-48 md:max-h-none">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Transactions
          </h3>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              recentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
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
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-4xl font-bold text-primary">
              KES {payingBooking?.fare.toLocaleString()}
            </p>
          </div>
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
                  className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center"
                >
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Change to Give</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">KES {change.toLocaleString()}</p>
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
    </motion.div>
  );
}