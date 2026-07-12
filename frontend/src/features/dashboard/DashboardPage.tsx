import { useQuery } from '@tanstack/react-query';
import { Truck, Users, Route, Wrench, Activity, TrendingUp, CheckCircle, AlertTriangle, Fuel, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats, getMonthlyTrends } from '../../mockApi/analyticsApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { getDrivers } from '../../mockApi/driverApi';
import { getMaintenanceRecords } from '../../mockApi/maintenanceApi';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonCard } from '../../components/common/Skeleton';
import { formatCurrency, formatCompact } from '../../utils/formatCurrency';
import { formatDate, getLicenseStatus, daysUntil } from '../../utils/formatDate';
import { motion } from 'framer-motion';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
const AREA_COLORS = { revenue: '#f59e0b', fuel: '#3b82f6', trips: '#10b981' };

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 10000,
  });

  const { data: trends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: getMonthlyTrends,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
  });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance'],
    queryFn: getMaintenanceRecords,
  });

  const vehicleStatusData = stats ? [
    { name: 'Available', value: stats.availableVehicles },
    { name: 'On Trip', value: stats.activeVehicles },
    { name: 'In Shop', value: stats.inMaintenanceVehicles },
    { name: 'Retired', value: stats.retiredVehicles },
  ].filter(d => d.value > 0) : [];

  const expiringDrivers = drivers?.filter((d) => {
    const s = getLicenseStatus(d.licenseExpiryDate);
    return s === 'expiring_soon' || s === 'expired';
  }) ?? [];

  const upcomingMaintenance = maintenance?.filter((m) => m.status === 'active') ?? [];

  const recentActivities = [
    { time: '2h ago', text: 'Trip TR001 dispatched — TRUCK-11 to Pune', type: 'info' as const },
    { time: '5h ago', text: 'MINI-03 sent to maintenance — Engine Repair', type: 'warning' as const },
    { time: '1d ago', text: 'Trip TR002 completed — ₹78,000 revenue logged', type: 'success' as const },
    { time: '2d ago', text: 'Trip TR004 cancelled — Force Majeure', type: 'error' as const },
    { time: '3d ago', text: 'Driver Priya Sharma added to fleet', type: 'info' as const },
  ];

  const kpiCards = [
    { title: 'Active Vehicles', value: stats?.activeVehicles ?? 0, icon: Truck, iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-900/20', subtitle: 'Currently on trip' },
    { title: 'Available Vehicles', value: stats?.availableVehicles ?? 0, icon: CheckCircle, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', subtitle: 'Ready to dispatch' },
    { title: 'In Maintenance', value: stats?.inMaintenanceVehicles ?? 0, icon: Wrench, iconColor: 'text-amber-600', iconBg: 'bg-amber-50 dark:bg-amber-900/20', subtitle: 'In shop' },
    { title: 'Active Trips', value: stats?.activeTrips ?? 0, icon: Route, iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-900/20', subtitle: 'In progress' },
    { title: 'Pending Trips', value: stats?.pendingTrips ?? 0, icon: Activity, iconColor: 'text-purple-600', iconBg: 'bg-purple-50 dark:bg-purple-900/20', subtitle: 'Awaiting dispatch' },
    { title: 'Drivers On Duty', value: stats?.driversOnDuty ?? 0, icon: Users, iconColor: 'text-teal-600', iconBg: 'bg-teal-50 dark:bg-teal-900/20', subtitle: 'Currently driving' },
    { title: 'Fleet Utilization', value: `${stats?.fleetUtilization ?? 0}%`, icon: TrendingUp, iconColor: 'text-brand-600', iconBg: 'bg-brand-50 dark:bg-brand-900/20', subtitle: 'Active + In-shop / Total' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Real-time overview of your fleet operations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statsLoading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <KpiCard {...card} />
            </motion.div>
          ))
        }
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vehicle Status Donut */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Vehicle Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {vehicleStatusData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} vehicles`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {vehicleStatusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i] }} />
                <span className="text-gray-500 dark:text-gray-400 truncate">{d.name}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trip Trends */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Monthly Trip Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends ?? []} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel Consumption */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Fuel Expenditure</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Fuel Cost']} />
              <Line type="monotone" dataKey="fuel" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Fuel" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="section-title mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((a, i) => {
              const colorMap = { info: 'bg-blue-500', warning: 'bg-amber-500', success: 'bg-emerald-500', error: 'bg-red-500' };
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colorMap[a.type]}`} />
                  <div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Active Maintenance</h3>
          {upcomingMaintenance.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No active maintenance</p>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map((m) => {
                const vehicle = vehicles?.find((v) => v.id === m.vehicleId);
                return (
                  <div key={m.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{vehicle?.registrationNumber ?? 'Unknown'}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{m.serviceType.replace('_', ' ')}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(m.scheduledDate)}</p>
                    </div>
                    <StatusBadge status="active" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expiring Licenses */}
        <div className="card p-5">
          <h3 className="section-title mb-4">License Alerts</h3>
          {expiringDrivers.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">All licenses valid ✓</p>
          ) : (
            <div className="space-y-3">
              {expiringDrivers.map((d) => {
                const status = getLicenseStatus(d.licenseExpiryDate);
                const days = daysUntil(d.licenseExpiryDate);
                return (
                  <div key={d.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{d.name}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(d.licenseExpiryDate)}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={status} />
                      <p className="text-[10px] text-gray-400 mt-0.5">{days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
