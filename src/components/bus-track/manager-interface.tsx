'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Bus, TrendingUp, Activity, AlertTriangle,
  Zap, Clock, BarChart3, Brain,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppHeader } from './app-header';
import { STATUS_COLORS } from './constants';
import { useRealtimeSocket, useActivityFeed } from '@/hooks/use-realtime';
import type { StaffUser } from './types';

interface ManagerInterfaceProps {
  user: StaffUser;
  onLogout: () => void;
  toast: any;
}

const AI_INSIGHTS = [
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: 'High Demand Predicted',
    description: 'Nairobi → Mombasa route shows 40% higher booking rate than usual for this time. Consider scheduling an additional bus at 11:00 and 14:00 to prevent overcrowding and maximize revenue capture.',
    color: 'border-primary/20 bg-primary/5',
    iconColor: 'text-primary bg-primary/10',
    tag: 'Demand AI',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Revenue Tracking Above Average',
    description: 'Today\'s revenue is tracking 12% above the 7-day rolling average. Payment processing time has improved by 0.8s per transaction since the morning shift change.',
    color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
    iconColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    tag: 'Revenue AI',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Departure Delay Risk',
    description: 'The 09:30 Kisumu bus has only 45% boarding completion with 12 minutes to departure. The gate team may need to make PA announcements to accelerate boarding.',
    color: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
    iconColor: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    tag: 'Operations AI',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Staff Utilization Optimal',
    description: 'All 3 tills are active with balanced queue lengths (avg 2.3 customers waiting). No reallocation needed at this time.',
    color: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
    iconColor: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    tag: 'Staff AI',
  },
];

export function ManagerInterface({ user, onLogout, toast }: ManagerInterfaceProps) {
  const { isConnected, on, joinDashboard } = useRealtimeSocket();
  const activities = useActivityFeed();
  const [stats, setStats] = useState<any>(null);
  const [departures, setDepartures] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, depRes, staffRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/departures'),
        fetch('/api/admin/staff'),
      ]);
      setStats(await statsRes.json());
      const depData = await depRes.json();
      setDepartures(depData.departures || []);
      const staffData = await staffRes.json();
      setStaffList(staffData.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    joinDashboard();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData, joinDashboard]);

  // Real-time updates
  useEffect(() => {
    const offs = [
      on('dashboard:booking-created', () => fetchData()),
      on('dashboard:payment-completed', () => fetchData()),
      on('dashboard:gate-event', () => fetchData()),
    ];
    return () => offs.forEach(off => off());
  }, [on, fetchData]);

  const kpis = stats ? [
    { label: 'Revenue', value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', change: '+12%' },
    { label: 'Passengers', value: stats.totalPassengers || 0, icon: <Users className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', change: '+8%' },
    { label: 'Buses Departed', value: `${stats.busesDeparted || 0}/${stats.totalBuses || 0}`, icon: <Bus className="h-5 w-5" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', change: 'On Track' },
    { label: 'On-Time Rate', value: `${stats.onTimeRate || 0}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', change: 'vs 94% yesterday' },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-screen flex flex-col bg-background"
    >
      <AppHeader user={user} onLogout={onLogout} iconBgColor="bg-purple-600" isConnected={isConnected} />

      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{kpi.label}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Live Departure Board */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Live Departure Board
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead className="hidden sm:table-cell">Bus</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departures.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.routeName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs">{d.busPlate}</span>
                          <Badge variant="outline" className="ml-1 text-[10px]">{d.busType}</Badge>
                        </TableCell>
                        <TableCell>{d.gateNumber || '—'}</TableCell>
                        <TableCell className="font-mono">{d.departureTime}</TableCell>
                        <TableCell><Badge className={STATUS_COLORS[d.status] || ''}>{d.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={d.occupancy} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">{d.occupancy}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" /> AI Insights
              <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">Live</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_INSIGHTS.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Card className={`border ${insight.color}`}>
                    <CardContent className="p-4 flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${insight.iconColor}`}>
                        {insight.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{insight.title}</p>
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">{insight.tag}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Real-Time Activity Feed */}
          {activities.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Live Activity Feed
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.slice(0, 10).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs p-1.5 rounded-lg hover:bg-muted/50">
                      <Badge variant="outline" className="text-[9px] h-4 shrink-0">{a.type}</Badge>
                      <span className="flex-1 truncate">{a.message}</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Right - Staff Activity */}
        <aside className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l bg-card p-4 overflow-y-auto shrink-0 max-h-48 lg:max-h-none">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Staff Activity
          </h3>
          <div className="space-y-2">
            {staffList.filter((s: any) => s.active).map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {s.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <Badge variant="outline" className="text-[10px] h-4">{s.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </motion.div>
  );
}