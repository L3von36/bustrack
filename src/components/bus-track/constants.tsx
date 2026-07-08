import React from 'react';
import {
  Ticket, CreditCard, ShieldCheck, BarChart3, Settings,
  Banknote, Smartphone, QrCode,
} from 'lucide-react';
import type { Role } from './types';

export const ROLE_CONFIG: Record<Role, { icon: React.ReactNode; color: string; desc: string; email: string; bgColor: string }> = {
  TICKETER: { icon: <Ticket className="h-6 w-6" />, color: 'text-emerald-600', bgColor: 'bg-emerald-600', desc: 'Search routes, select seats, create bookings', email: 'alice@bustrack.com' },
  CASHIER: { icon: <CreditCard className="h-6 w-6" />, color: 'text-teal-600', bgColor: 'bg-teal-600', desc: 'Process payments for pending bookings', email: 'bob@bustrack.com' },
  GATEMAN: { icon: <ShieldCheck className="h-6 w-6" />, color: 'text-amber-600', bgColor: 'bg-amber-600', desc: 'Validate tickets and manage boarding', email: 'charles@bustrack.com' },
  MANAGER: { icon: <BarChart3 className="h-6 w-6" />, color: 'text-violet-600', bgColor: 'bg-violet-600', desc: 'View dashboard stats and operations', email: 'diana@bustrack.com' },
  SUPERADMIN: { icon: <Settings className="h-6 w-6" />, color: 'text-rose-600', bgColor: 'bg-rose-600', desc: 'Full system management and analytics', email: 'edward@bustrack.com' },
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BOARDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DEPARTED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DELAYED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BOARDED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  NO_SHOW: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  VALID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INVALID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WRONG_GATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ALREADY_BOARDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#f97316', '#6366f1'];

export const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  MOBILE_MONEY: <Smartphone className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  QR_CODE: <QrCode className="h-4 w-4" />,
};