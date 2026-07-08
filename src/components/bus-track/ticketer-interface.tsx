'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bus, Ticket, Clock, Users, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppHeader } from './app-header';
import { STATUS_COLORS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser, ScheduleItem } from './types';

interface TicketerInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

export function TicketerInterface({ user, onLogout, toast }: TicketerInterfaceProps) {
  const { isConnected, emit, on, joinSchedule, leaveSchedule } = useRealtimeSocket();
  const [search, setSearch] = useState('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleDetail, setScheduleDetail] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);

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

  useEffect(() => { fetchSchedules(); }, []);

  // Real-time seat updates
  useEffect(() => {
    const off = on('seat:booked', (data: { scheduleId: string; seatNumber: string; passengerName: string }) => {
      if (selectedSchedule?.id === data.scheduleId) {
        // Refresh schedule detail to show the new booking
        selectSchedule(selectedSchedule);
        fetchSchedules();
        toast({ title: 'Seat Booked', description: `${data.passengerName} just booked seat ${data.seatNumber}` });
      }
    });
    return off;
  }, [selectedSchedule, on, toast, fetchSchedules]);

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
        // Emit real-time event
        emit('booking:created', {
          scheduleId: selectedSchedule.id,
          seatNumber: selectedSeat,
          passengerName,
          routeName: selectedSchedule.routeName,
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

  const bookingFormContent = (
    <div className="p-4 flex flex-col h-full">
      <h3 className="font-semibold mb-4">New Booking</h3>
      {selectedSeat ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Seat</span>
              <Badge className="bg-primary text-primary-foreground">{selectedSeat}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selectedSchedule?.routeName}</p>
            <p className="text-lg font-bold mt-1">KES {selectedSchedule?.fare.toLocaleString()}</p>
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
          <Input placeholder="Full name" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Phone Number</Label>
          <Input placeholder="+254..." value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} className="mt-1" />
        </div>
      </div>
      <Button
        className="w-full mt-4"
        disabled={!selectedSeat || !passengerName || !passengerPhone || bookingLoading}
        onClick={handleBook}
      >
        {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <><Ticket className="h-4 w-4 mr-2" /> Confirm Booking</>
        )}
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-screen flex flex-col bg-background"
    >
      <AppHeader user={user} onLogout={onLogout} iconBgColor="bg-blue-600" isConnected={isConnected} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Routes */}
        <aside className="hidden md:flex w-72 lg:w-80 border-r flex-col bg-card shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search routes..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
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
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
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
          {/* Mobile search bar */}
          <div className="md:hidden p-3 border-b bg-card">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search routes..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-10" />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">Routes</Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-3 border-b">
                    <SheetTitle>Schedules</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto p-2 space-y-1">
                    {schedules.map((s) => (
                      <Card
                        key={s.id}
                        className={`cursor-pointer hover:shadow-sm transition-all p-3 ${selectedSchedule?.id === s.id ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => { selectSchedule(s); }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{s.routeName}</p>
                            <p className="text-xs text-muted-foreground">{s.busPlate} · {s.departureTime}</p>
                          </div>
                          <span className="text-sm font-semibold">KES {s.fare.toLocaleString()}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {selectedSchedule && scheduleDetail ? (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedSchedule.routeName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSchedule.busPlate} · Gate {selectedSchedule.gateNumber || 'TBD'} · {selectedSchedule.departureTime}
                  </p>
                </div>
                {/* Mobile booking button */}
                <div className="md:hidden">
                  <Sheet open={mobileBookingOpen} onOpenChange={setMobileBookingOpen}>
                    <SheetTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Ticket className="h-4 w-4" /> Book
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[70vh]">
                      {bookingFormContent}
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="hidden md:flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border bg-background" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" /> Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-primary" /> Selected</span>
                </div>
              </div>

              {/* Bus Visualization */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-card border-2 border-primary/20 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-sm">
                  <div className="flex justify-end mb-4 pr-2">
                    <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      DRIVER
                    </div>
                  </div>
                  <div
                    className="grid gap-1.5 sm:gap-2 justify-items-center"
                    style={{
                      gridTemplateColumns: `repeat(${scheduleDetail.bus.cols}, 1fr)`,
                      maxWidth: scheduleDetail.bus.cols * 56 + (scheduleDetail.bus.cols - 1) * 8,
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

                      return (
                        <motion.button
                          key={seatNum}
                          whileHover={!isOccupied ? { scale: 1.08 } : {}}
                          whileTap={!isOccupied ? { scale: 0.95 } : {}}
                          className={`
                            relative w-12 h-11 sm:w-14 sm:h-12 rounded-lg border-2 text-xs font-medium
                            flex flex-col items-center justify-center transition-all
                            ${isOccupied
                              ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                            }
                          `}
                          disabled={isOccupied}
                          onClick={() => setSelectedSeat(isSelected ? null : seatNum)}
                          title={booked ? `${booked.passengerName}` : seatNum}
                        >
                          <span className="text-[10px] opacity-70">{row}</span>
                          <span className="font-bold">{colLetter}</span>
                          {isOccupied && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500 text-white flex items-center justify-center text-[8px]">
                              X
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

        {/* Right Panel - Booking Form (desktop) */}
        <aside className="hidden md:flex w-80 border-l flex-col bg-card shrink-0">
          {selectedSchedule && scheduleDetail ? (
            bookingFormContent
          ) : (
            <div className="p-4 flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
              Select a schedule first
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  );
}