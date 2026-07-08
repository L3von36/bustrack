'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bus, Ticket, Clock, Users, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AppHeader } from './app-header';
import { STATUS_COLORS } from './constants';
import { useRealtimeSocket } from '@/hooks/use-realtime';
import type { StaffUser, ScheduleItem } from './types';

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface TicketerInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

/* -------------------------------------------------------------------------- */
/*  Status dot helper                                                         */
/* -------------------------------------------------------------------------- */

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-emerald-400',
  BOARDING: 'bg-amber-400',
  DEPARTED: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
  DELAYED: 'bg-orange-400',
};

/* -------------------------------------------------------------------------- */
/*  Popular route chips                                                       */
/* -------------------------------------------------------------------------- */

const POPULAR_ROUTES = ['Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function TicketerInterface({ user, onLogout, toast }: TicketerInterfaceProps) {
  const { isConnected, emit, on } = useRealtimeSocket();

  /* ---- state ---- */
  const [search, setSearch] = useState('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleDetail, setScheduleDetail] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mobileRouteOpen, setMobileRouteOpen] = useState(false);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);

  /* ---- fetch schedules ---- */
  const fetchSchedules = useCallback(
    async (searchTerm?: string) => {
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
    },
    [search],
  );

  useEffect(() => {
    fetchSchedules();
  }, []);

  /* ---- realtime seat updates ---- */
  useEffect(() => {
    const off = on(
      'seat:booked',
      (data: { scheduleId: string; seatNumber: string; passengerName: string }) => {
        if (selectedSchedule?.id === data.scheduleId) {
          selectSchedule(selectedSchedule);
          fetchSchedules();
          toast.success(`${data.passengerName} just booked seat ${data.seatNumber}`);
        }
      },
    );
    return off;
  }, [selectedSchedule, on, toast]);

  /* ---- helpers ---- */
  const handleSearch = (val: string) => {
    setSearch(val);
    fetchSchedules(val);
  };

  const selectSchedule = async (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    setSelectedSeat(null);
    setPassengerName('');
    setPassengerPhone('');
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`);
      const data = await res.json();
      setScheduleDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---- book ---- */
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
        toast.success(`Ref: ${data.booking.reference} — Seat ${selectedSeat}. Awaiting payment.`);
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
        toast.error(data.error || 'Booking failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setBookingLoading(false);
    }
  };

  /* ---- derived ---- */
  const canBook = !!selectedSeat && passengerName.trim().length > 0 && passengerPhone.trim().length > 0 && !bookingLoading;

  /* ---- seat grid data ---- */
  const seatGrid = useMemo(() => {
    if (!scheduleDetail?.bus) return [];
    const { rows, cols } = scheduleDetail.bus;
    const seats: Array<{
      seatNum: string;
      row: number;
      colLetter: string;
      isOccupied: boolean;
      bookedBy?: string;
    }> = [];
    for (let idx = 0; idx < rows * cols; idx++) {
      const row = Math.floor(idx / cols) + 1;
      const colIdx = idx % cols;
      const colLetter = String.fromCharCode(65 + colIdx);
      const seatNum = `${row}${colLetter}`;
      const booked = scheduleDetail.bookedSeats?.find((b: any) => b.seatNumber === seatNum);
      seats.push({
        seatNum,
        row,
        colLetter,
        isOccupied: !!booked,
        bookedBy: booked?.passengerName,
      });
    }
    return seats;
  }, [scheduleDetail]);

  /* ========================================================================= */
  /*  Sub-components                                                            */
  /* ========================================================================= */

  /* ---- Route Card (sidebar & sheet) ---- */
  const RouteCard = ({ s }: { s: ScheduleItem }) => {
    const isSelected = selectedSchedule?.id === s.id;
    return (
      <button
        onClick={() => {
          selectSchedule(s);
          setMobileRouteOpen(false);
        }}
        className={`
          w-full text-left rounded-lg p-3
          transition-colors duration-150 active:scale-[0.99]
          ${isSelected
            ? 'border border-emerald-500/30 bg-emerald-500/[0.06] shadow-sm'
            : 'border border-transparent hover:bg-muted/50'
          }
        `}
      >
        {/* Row 1: route name + status */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground leading-tight truncate">
            {s.routeName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status] || 'bg-zinc-500'}`} />
            <span className="text-[11px] text-muted-foreground">{s.status}</span>
          </div>
        </div>
        {/* Row 2: time + bus plate */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-zinc-400" />
            {s.departureTime}
          </span>
          <span className="text-[11px] text-zinc-500">{s.busPlate}</span>
        </div>
        {/* Row 3: fare + seats */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] font-medium text-foreground">
            KES {s.fare.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {s.bookedCount}/{s.totalSeats}
          </span>
        </div>
      </button>
    );
  };

  /* ---- Route sidebar list ---- */
  const RouteList = () => (
    <div className="flex flex-col h-full">
      {/* Search + chips */}
      <div className="p-3 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Search routes..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-8 text-[13px] bg-background border-border/60 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
          />
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {POPULAR_ROUTES.map((r) => (
            <button
              key={r}
              onClick={() => handleSearch(r)}
              className={`
                text-[11px] px-2.5 py-0.5 rounded-full border transition-colors active:scale-[0.97]
                ${search === r
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted/40 border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto bt-scroll p-2 space-y-1">
        {loading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <Bus className="h-4.5 w-4.5 text-zinc-400" />
            </div>
            <p className="text-[13px] text-muted-foreground">No schedules found</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Try adjusting your search</p>
          </div>
        ) : (
          schedules.map((s) => <RouteCard key={s.id} s={s} />)
        )}
      </div>
    </div>
  );

  /* ---- Seat Map ---- */
  const SeatMap = () => {
    if (detailLoading) {
      return (
        <div className="border border-border/60 bg-card rounded-xl p-6 flex items-center justify-center animate-bt-fade-in">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            <span className="text-[12px] text-muted-foreground">Loading seat map…</span>
          </div>
        </div>
      );
    }

    if (!scheduleDetail?.bus) return null;

    const { cols, totalSeats } = scheduleDetail.bus;
    const availableSeats = scheduleDetail.availableSeats ?? totalSeats - (scheduleDetail.bookedSeats?.length ?? 0);

    return (
      <div
        className="border border-border/60 bg-card rounded-xl p-5 animate-bt-slide-up"
      >
        {/* Bus header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Bus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{selectedSchedule?.busPlate}</p>
              <p className="text-[11px] text-muted-foreground">{selectedSchedule?.busType}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available
            </p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {availableSeats}<span className="text-sm font-normal text-muted-foreground">/{totalSeats}</span>
            </p>
          </div>
        </div>

        {/* Driver area */}
        <div className="flex justify-end mb-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium px-2.5 py-1 rounded-md bg-muted/50 border border-border/40">
            Driver
          </div>
        </div>

        {/* Seat grid */}
        <div
          className="grid gap-1.5 justify-items-center mx-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: cols * 48 + (cols - 1) * 6,
          }}
        >
          {seatGrid.map((seat) => {
            const isSelected = selectedSeat === seat.seatNum;
            return (
              <button
                key={seat.seatNum}
                disabled={seat.isOccupied}
                onClick={() => setSelectedSeat(isSelected ? null : seat.seatNum)}
                title={seat.isOccupied ? seat.bookedBy : seat.seatNum}
                className={`
                  relative w-11 h-10 rounded-md text-[11px] font-medium
                  flex flex-col items-center justify-center
                  transition-all duration-100 cursor-pointer
                  ${seat.isOccupied
                    ? 'bg-muted/40 text-zinc-500 cursor-not-allowed'
                    : isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 scale-[1.04]'
                      : 'bg-muted/60 hover:bg-emerald-500/10 text-foreground border border-transparent hover:border-emerald-500/20'
                  }
                `}
              >
                <span className="text-[9px] opacity-50 leading-none">{seat.row}</span>
                <span className="font-bold leading-tight">{seat.colLetter}</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded-[4px] bg-muted/60 border border-border/40" />
            <span className="text-[11px] text-zinc-500">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded-[4px] bg-muted/40" />
            <span className="text-[11px] text-zinc-500">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded-[4px] bg-emerald-600" />
            <span className="text-[11px] text-zinc-500">Selected</span>
          </div>
        </div>
      </div>
    );
  };

  /* ---- Booking Form ---- */
  const BookingForm = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/60">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Booking</p>
      </div>

      {selectedSeat ? (
        <div className="mx-4 mt-4 animate-bt-slide-up">
          <div className="border border-emerald-500/20 bg-emerald-500/[0.04] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected seat</span>
              <Badge className="bg-emerald-600 text-white text-[11px] px-2.5 py-0.5 rounded-full font-semibold border-0">
                {selectedSeat}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{selectedSchedule?.routeName}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">
              KES {selectedSchedule?.fare.toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4">
          <div className="border border-border/60 bg-card rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
              <Ticket className="h-4.5 w-4.5 text-zinc-400" />
            </div>
            <p className="text-[13px] text-muted-foreground">Select a seat to continue</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3 flex-1">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Passenger Name
          </Label>
          <Input
            placeholder="Full name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="h-9 text-[13px] bg-background border-border/60 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Phone Number
          </Label>
          <Input
            placeholder="+254..."
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
            className="h-9 text-[13px] bg-background border-border/60 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
          />
        </div>
      </div>

      <div className="p-4 border-t border-border/60">
        <Button
          className="w-full h-10 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          disabled={!canBook}
          onClick={handleBook}
        >
          {bookingLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Ticket className="h-3.5 w-3.5 mr-1.5" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );

  /* ---- Empty state for main area ---- */
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center animate-bt-fade-in">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
          <Bus className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="text-[14px] text-foreground font-medium">Select a schedule</p>
        <p className="text-[12px] text-muted-foreground mt-1">Choose a route from the list to view the seat map</p>
      </div>
    </div>
  );

  /* ========================================================================= */
  /*  Render                                                                    */
  /* ========================================================================= */

  return (
    <div className="h-full flex flex-col">
      {/* ---- Header ---- */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* ---- Body ---- */}
      <main className="flex-1 overflow-hidden flex">

        {/* ======== LEFT SIDEBAR (desktop) ======== */}
        <aside className="hidden md:flex w-64 shrink-0 border-r border-border/60 flex-col bg-card/50">
          <RouteList />
        </aside>

        {/* ======== MAIN AREA ======== */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile: search + route sheet trigger */}
          <div className="md:hidden p-3 border-b border-border/60 bg-card/50 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Search routes..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-9 text-[13px] bg-background border-border/60 focus-visible:ring-emerald-500/20"
              />
            </div>
            <Sheet open={mobileRouteOpen} onOpenChange={setMobileRouteOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-[12px] gap-1.5 border-border/60">
                  <Bus className="h-3.5 w-3.5" />
                  Routes
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-card">
                <SheetHeader className="p-3 border-b border-border/60">
                  <SheetTitle className="text-[13px] font-medium">Schedules</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto bt-scroll p-2 space-y-1">
                  {schedules.map((s) => <RouteCard key={s.id} s={s} />)}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Content area */}
          {selectedSchedule ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Seat map section */}
              <div className="flex-1 overflow-y-auto bt-scroll p-4 lg:p-6">
                {/* Route header */}
                <div className="mb-5 animate-bt-fade-in">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">
                      {selectedSchedule.routeName}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 rounded-full border-0 ${STATUS_COLORS[selectedSchedule.status] || ''}`}
                    >
                      {selectedSchedule.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedSchedule.departureTime}
                    </span>
                    <span>{selectedSchedule.busPlate}</span>
                    <span>Gate {selectedSchedule.gateNumber || 'TBD'}</span>
                  </div>
                </div>

                {/* Seat map */}
                <SeatMap />

                {/* Mobile: booking button at bottom */}
                <div className="lg:hidden mt-4">
                  <Sheet open={mobileBookingOpen} onOpenChange={setMobileBookingOpen}>
                    <SheetTrigger asChild>
                      <Button
                        className="w-full h-10 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        disabled={!selectedSeat}
                      >
                        <Ticket className="h-4 w-4 mr-1.5" />
                        {selectedSeat ? `Book Seat ${selectedSeat}` : 'Select a Seat'}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[75vh] bg-card p-0 rounded-t-xl">
                      <BookingForm />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Booking form (desktop only) */}
              <aside className="hidden lg:flex w-72 shrink-0 border-l border-border/60 bg-card/50">
                <div className="w-full flex flex-col">
                  {selectedSchedule && scheduleDetail ? (
                    <BookingForm />
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-4">
                      <p className="text-[12px] text-muted-foreground text-center">Loading…</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}