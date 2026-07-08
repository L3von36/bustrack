export type Role = 'TICKETER' | 'CASHIER' | 'GATEMAN' | 'MANAGER' | 'SUPERADMIN';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  stationId: string | null;
  active: boolean;
  station?: { name: string; city: string } | null;
}

export interface ScheduleItem {
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

export interface BookingItem {
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

export interface ActivityItem {
  type: string;
  message: string;
  timestamp: string;
  role?: string;
}