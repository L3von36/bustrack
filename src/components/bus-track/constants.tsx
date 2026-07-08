import React from 'react';
import {
  Bus, Ticket, CreditCard, ShieldCheck, BarChart3, Settings,
  Banknote, Smartphone, QrCode,
} from 'lucide-react';
import type { Role } from './types';

export const ROLE_CONFIG: Record<Role, { icon: React.ReactNode; color: string; desc: string; email: string; bgColor: string }> = {
  TICKETER: { icon: <Ticket className="h-6 w-6" />, color: 'text-blue-600', bgColor: 'bg-blue-600', desc: 'Search routes, select seats, create bookings', email: 'alice@bustrack.com' },
  CASHIER: { icon: <CreditCard className="h-6 w-6" />, color: 'text-emerald-600', bgColor: 'bg-emerald-600', desc: 'Process payments for pending bookings', email: 'bob@bustrack.com' },
  GATEMAN: { icon: <ShieldCheck className="h-6 w-6" />, color: 'text-amber-600', bgColor: 'bg-amber-600', desc: 'Validate tickets and manage boarding', email: 'charles@bustrack.com' },
  MANAGER: { icon: <BarChart3 className="h-6 w-6" />, color: 'text-purple-600', bgColor: 'bg-purple-600', desc: 'View dashboard stats and operations', email: 'diana@bustrack.com' },
  SUPERADMIN: { icon: <Settings className="h-6 w-6" />, color: 'text-red-600', bgColor: 'bg-red-600', desc: 'Full system management and analytics', email: 'edward@bustrack.com' },
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BOARDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DEPARTED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  DELAYED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  BOARDED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  NO_SHOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  VALID: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  INVALID: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  WRONG_GATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ALREADY_BOARDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

export const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  MOBILE_MONEY: <Smartphone className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  QR_CODE: <QrCode className="h-4 w-4" />,
};

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];