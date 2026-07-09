'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bus,
  Ticket,
  Clock,
  Users,
  Loader2,
  Search,
  CircleDot,
  MapPin,
  Sparkles,
} from 'lucide-react';
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

const POPULAR_ROUTES = ['Dire Dawa', 'Bahir Dar', 'Hawassa', 'Adama'];

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
  const seatRows = useMemo(() => {
    if (!scheduleDetail?.bus) return [];
    const { rows, cols } = scheduleDetail.bus;
    const result: Array<Array<{
      seatNum: string;
      row: number;
      colLetter: string;
      isOccupied: boolean;
      bookedBy?: string;
    }>> = [];

    for (let r = 0; r < rows; r++) {
      const rowSeats: Array<{
        seatNum: string;
        row: number;
        colLetter: string;
        isOccupied: boolean;
        bookedBy?: string;
      }> = [];
      for (let c = 0; c < cols; c++) {
        const row = r + 1;
        const colLetter = String.fromCharCode(65 + c);
        const seatNum = `${row}${colLetter}`;
        const booked = scheduleDetail.bookedSeats?.find((b: any) => b.seatNumber === seatNum);
        rowSeats.push({
          seatNum,
          row,
          colLetter,
          isOccupied: !!booked,
          bookedBy: booked?.passengerName,
        });
      }
      result.push(rowSeats);
    }
    return result;
  }, [scheduleDetail]);

  /* ========================================================================= */
  /*  Sub-components                                                            */
  /* ========================================================================= */

  /* ---- Schedule Route Card (horizontal scroll) ---- */
  const ScheduleCard = ({ s, index }: { s: ScheduleItem; index: number }) => {
    const isSelected = selectedSchedule?.id === s.id;
    const fillPercent = Math.round((s.bookedCount / s.totalSeats) * 100);
    return (
      <button
        onClick={() => selectSchedule(s)}
        className={`
          shrink-0 w-[220px] sm:w-[260px] text-left rounded-xl p-4 border
          transition-all duration-200 active:scale-[0.98] group
          animate-bt-fade-in
          ${isSelected
            ? 'border-emerald-500/40 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/5'
            : 'border-border/60 bg-card hover:border-border hover:shadow-md hover:shadow-black/5'
          }
        `}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Route name */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-emerald-500/20'
              : 'bg-muted/70 group-hover:bg-muted'
          }`}>
            <Bus className={`h-4 w-4 transition-colors ${
              isSelected ? 'text-emerald-500' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
              {s.routeName}
            </p>
            <p className="text-[11px] text-muted-foreground">{s.busPlate}</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status] || 'bg-zinc-500'}`} />
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 rounded-full border-0 ${STATUS_COLORS[s.status] || ''}`}
            >
              {s.status}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {s.departureTime}
          </span>
        </div>

        {/* Bottom: fare + fill bar */}
        <div className="flex items-end justify-between">
          <span className="text-lg font-bold tracking-tight text-foreground">
            ETB {s.fare.toLocaleString()}
          </span>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">
              {s.bookedCount}/{s.totalSeats}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-muted/80 mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  fillPercent > 80 ? 'bg-amber-500' : fillPercent > 50 ? 'bg-emerald-500/70' : 'bg-emerald-500'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>
      </button>
    );
  };

  /* ---- Premium Seat Map ---- */
  const SeatMap = () => {
    if (detailLoading) {
      return (
        <div className="h-full flex items-center justify-center animate-bt-fade-in">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading seat map…</span>
          </div>
        </div>
      );
    }

    if (!scheduleDetail?.bus) return null;

    const { cols, totalSeats } = scheduleDetail.bus;
    const availableSeats = scheduleDetail.availableSeats ?? totalSeats - (scheduleDetail.bookedSeats?.length ?? 0);
    const aisleAfterCol = Math.floor(cols / 2);

    return (
      <div className="animate-bt-slide-up h-full flex flex-col">
        {/* Bus info bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Bus className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedSchedule?.busPlate}</p>
              <p className="text-xs text-muted-foreground">{selectedSchedule?.busType}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Available
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {availableSeats}<span className="text-sm font-normal text-muted-foreground">/{totalSeats}</span>
            </p>
          </div>
        </div>

        {/* Bus body with gradient background */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            {/* Bus outer shell */}
            <div className="relative rounded-t-[2rem] border border-border/40 bg-gradient-to-b from-emerald-950/20 via-emerald-950/10 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent overflow-hidden">
              {/* Subtle top shine */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

              <div className="p-5 pb-6">
                {/* Steering wheel area */}
                <div className="flex items-center justify-end mb-5 pr-2">
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" fill="currentColor" /><line x1="12" y1="4" x2="12" y2="10" /><line x1="12" y1="14" x2="12" y2="20" /></svg>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Driver</span>
                  </div>
                </div>

                {/* Divider line behind driver */}
                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent mb-5" />

                {/* Seat rows */}
                <div className="space-y-2.5">
                  {seatRows.map((rowSeats, rowIdx) => (
                    <div key={rowIdx} className="flex items-center justify-center gap-2">
                      {/* Left seats (before aisle) */}
                      <div className="flex gap-2">
                        {rowSeats.slice(0, aisleAfterCol).map((seat) => {
                          const isSelected = selectedSeat === seat.seatNum;
                          return (
                            <button
                              key={seat.seatNum}
                              disabled={seat.isOccupied}
                              onClick={() => setSelectedSeat(isSelected ? null : seat.seatNum)}
                              title={seat.isOccupied ? seat.bookedBy : seat.seatNum}
                              className={`
                                relative w-12 h-11 rounded-lg text-xs font-bold
                                flex flex-col items-center justify-center gap-0
                                transition-all duration-150 cursor-pointer select-none
                                ${seat.isOccupied
                                  ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 ring-2 ring-emerald-400/40'
                                    : 'bg-card hover:bg-emerald-500/10 text-foreground border border-border/50 hover:border-emerald-500/30 shadow-sm hover:shadow-md hover:shadow-emerald-500/5'
                                }
                              `}
                            >
                              <span className="text-[9px] opacity-50 leading-none">{seat.row}</span>
                              <span className="leading-tight">{seat.colLetter}</span>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Aisle gap */}
                      <div className="w-8 sm:w-10 flex-shrink-0" />

                      {/* Right seats (after aisle) */}
                      <div className="flex gap-2">
                        {rowSeats.slice(aisleAfterCol).map((seat) => {
                          const isSelected = selectedSeat === seat.seatNum;
                          return (
                            <button
                              key={seat.seatNum}
                              disabled={seat.isOccupied}
                              onClick={() => setSelectedSeat(isSelected ? null : seat.seatNum)}
                              title={seat.isOccupied ? seat.bookedBy : seat.seatNum}
                              className={`
                                relative w-12 h-11 rounded-lg text-xs font-bold
                                flex flex-col items-center justify-center gap-0
                                transition-all duration-150 cursor-pointer select-none
                                ${seat.isOccupied
                                  ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 ring-2 ring-emerald-400/40'
                                    : 'bg-card hover:bg-emerald-500/10 text-foreground border border-border/50 hover:border-emerald-500/30 shadow-sm hover:shadow-md hover:shadow-emerald-500/5'
                                }
                              `}
                            >
                              <span className="text-[9px] opacity-50 leading-none">{seat.row}</span>
                              <span className="leading-tight">{seat.colLetter}</span>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rear divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent mt-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="w-4 h-3.5 rounded-md bg-card border border-border/50 shadow-sm" />
            <span className="text-[11px] text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3.5 rounded-md bg-muted/30 opacity-60" />
            <span className="text-[11px] text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3.5 rounded-md bg-emerald-600 shadow-md shadow-emerald-600/30" />
            <span className="text-[11px] text-muted-foreground">Selected</span>
          </div>
        </div>
      </div>
    );
  };

  /* ---- Premium Booking Panel ---- */
  const BookingPanel = () => (
    <div className="flex flex-col h-full animate-bt-slide-up">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
          Booking Details
        </p>
      </div>

      {/* Selected seat info OR empty state */}
      {selectedSeat ? (
        <div className="mx-6 animate-bt-scale-in">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/8 p-5">
            {/* Glow effect */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Selected Seat
                </span>
                <Badge className="bg-emerald-600 text-white text-[12px] px-3 py-0.5 rounded-full font-bold border-0 shadow-md shadow-emerald-600/20">
                  {selectedSeat}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-3 font-medium">
                {selectedSchedule?.routeName}
              </p>

              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-[11px] text-muted-foreground font-medium">ETB</span>
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  {selectedSchedule?.fare.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedSchedule?.departureTime}
                </span>
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3" />
                  Gate {selectedSchedule?.gateNumber || 'TBD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-6">
          <div className="border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
              <Ticket className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Select a seat to continue</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click any available seat on the map</p>
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="px-6 mt-5 space-y-4 flex-1">
        <div>
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2 block">
            Passenger Name
          </Label>
          <Input
            placeholder="Full name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="h-11 text-sm bg-background/80 border-border/60 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-muted-foreground/40"
          />
        </div>
        <div>
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2 block">
            Phone Number
          </Label>
          <Input
            placeholder="+251..."
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
            className="h-11 text-sm bg-background/80 border-border/60 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-6 pt-4 pb-6">
        <Button
          className="w-full h-12 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
          disabled={!canBook}
          onClick={handleBook}
        >
          {bookingLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Ticket className="h-4 w-4 mr-2" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );

  /* ---- Empty state (no schedule selected) ---- */
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center animate-bt-fade-in p-8">
      <div className="text-center max-w-sm">
        {/* Bus illustration area */}
        <div className="relative mx-auto w-40 h-40 mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 animate-pulse" />
          <div className="absolute inset-3 rounded-full bg-emerald-500/5 dark:bg-emerald-500/8" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/5">
              <Bus className="h-9 w-9 text-emerald-500" />
            </div>
          </div>
          {/* Floating decorative elements */}
          <div className="absolute top-2 right-6 w-3 h-3 rounded-full bg-emerald-500/20 animate-bt-fade-in delay-300" />
          <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-emerald-500/15 animate-bt-fade-in delay-400" />
          <div className="absolute top-8 left-2 w-1.5 h-1.5 rounded-full bg-emerald-500/25 animate-bt-fade-in delay-500" />
        </div>

        <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
          Select a Schedule
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Choose a route from the cards above to view the seat map and create a booking
        </p>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-border/40">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{schedules.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Schedules</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {schedules.filter((s) => s.status === 'SCHEDULED').length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Active</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {schedules.reduce((sum, s) => sum + (s.totalSeats - s.bookedCount), 0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Open Seats</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ========================================================================= */
  /*  Render                                                                    */
  /* ========================================================================= */

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ---- Header ---- */}
      <AppHeader user={user} onLogout={onLogout} isConnected={isConnected} />

      {/* ---- Main content ---- */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ======== TOP SEARCH SECTION (full width) ======== */}
        <div className="shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="px-4 sm:px-6 pt-4 pb-3">
            {/* Search input */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  placeholder="Search routes by origin or destination..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-11 text-sm bg-background border-border/50 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-muted-foreground/40 shadow-sm"
                />
              </div>

              {/* Popular route chips */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto bt-scroll pb-1">
                <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap mr-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </span>
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSearch(r)}
                    className={`
                      text-[12px] px-3.5 py-1.5 rounded-full border whitespace-nowrap
                      transition-all duration-150 active:scale-[0.97]
                      ${search === r
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-semibold'
                        : 'bg-background border-border/50 text-muted-foreground hover:text-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5 font-medium'
                      }
                    `}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ======== HORIZONTAL SCROLLABLE SCHEDULE CARDS ======== */}
          <div className="px-4 sm:px-6 pb-4">
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="shrink-0 w-[260px] h-[130px] rounded-xl" />
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bus className="h-4 w-4 opacity-50" />
                  <span className="text-sm">No schedules found. Try a different search.</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto bt-scroll pb-1 -mx-1 px-1">
                {schedules.map((s, i) => (
                  <ScheduleCard key={s.id} s={s} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======== CONTENT AREA ======== */}
        <div className="flex-1 overflow-hidden">
          {selectedSchedule ? (
            /* ---- TWO PANEL LAYOUT (desktop) / STACKED (mobile) ---- */
            <div className="h-full flex flex-col lg:flex-row">

              {/* LEFT PANEL: Seat Map (60%) */}
              <div className="lg:w-[60%] h-full overflow-y-auto bt-scroll p-4 sm:p-6 lg:p-8">
                {/* Route header */}
                <div className="mb-6 animate-bt-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {selectedSchedule.routeName}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 rounded-full border-0 font-semibold ${STATUS_COLORS[selectedSchedule.status] || ''}`}
                    >
                      {selectedSchedule.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedSchedule.departureTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Gate {selectedSchedule.gateNumber || 'TBD'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {selectedSchedule.bookedCount}/{selectedSchedule.totalSeats} booked
                    </span>
                  </div>
                </div>

                {/* Seat Map */}
                <SeatMap />

                {/* Mobile: booking CTA at bottom */}
                <div className="lg:hidden mt-6">
                  <Sheet open={mobileBookingOpen} onOpenChange={setMobileBookingOpen}>
                    <SheetTrigger asChild>
                      <Button
                        className="w-full h-12 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:shadow-none"
                        disabled={!selectedSeat}
                      >
                        {selectedSeat ? (
                          <>
                            <Ticket className="h-4 w-4 mr-2" />
                            Book Seat {selectedSeat} — ETB {selectedSchedule.fare.toLocaleString()}
                          </>
                        ) : (
                          'Select a Seat First'
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[80vh] bg-card p-0 rounded-t-2xl border-t border-border/40">
                      <SheetHeader className="p-5 pb-0">
                        <SheetTitle className="text-sm font-semibold text-foreground">Complete Booking</SheetTitle>
                      </SheetHeader>
                      <div className="mt-3">
                        <BookingPanel />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* RIGHT PANEL: Booking (40%) - desktop only */}
              <aside className="hidden lg:flex w-[40%] shrink-0 border-l border-border/40 bg-card/50 flex-col overflow-y-auto bt-scroll">
                {selectedSchedule && scheduleDetail ? (
                  <BookingPanel />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading booking details…</p>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            /* ---- EMPTY STATE ---- */
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}