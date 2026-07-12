import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Printer, TrendingUp, Fuel, DollarSign, BarChart3 } from 'lucide-react';
import { getDashboardStats, getMonthlyTrends } from '../../mockApi/analyticsApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { getVehicleCostBreakdowns, getFuelLogs } from '../../mockApi/fuelExpenseApi';
import { getMaintenanceRecords } from '../../mockApi/maintenanceApi';
import { KpiCard } from '../../components/common/KpiCard';
import { buildCsv, downloadCsv } from '../../utils/csvBuilder';
import { formatCurrency, formatCompact } from '../../utils/formatCurrency';
import { REGIONS, VEHICLE_TYPES } from '../../config/constants';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function AnalyticsPage() {
  const [regionFilter, setRegionFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats });
  const { data: trends = [] } = useQuery({ queryKey: ['monthly-trends'], queryFn: getMonthlyTrends });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: breakdowns = [] } = useQuery({ queryKey: ['cost-breakdowns'], queryFn: getVehicleCostBreakdowns });
  const { data: maintenance = [] } = useQuery({ queryKey: ['maintenance'], queryFn: getMaintenanceRecords });
  const { data: fuelLogs = [] } = useQuery({ queryKey: ['fuel-logs'], queryFn: getFuelLogs });

  let filteredVehicles = vehicles;
  if (regionFilter) filteredVehicles = filteredVehicles.filter((v) => v.region === regionFilter);
  if (vehicleTypeFilter) filteredVehicles = filteredVehicles.filter((v) => v.type === vehicleTypeFilter);

  const totalRevenue = filteredVehicles.reduce((s, v) => s + v.revenue, 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalMaintenanceCost = maintenance
    .filter((m) => m.status === 'completed')
    .reduce((s, m) => s + (m.actualCost ?? m.estimatedCost), 0);
  const operationalCost = totalFuelCost + totalMaintenanceCost;

  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalDistance = filteredVehicles.reduce((s, v) => s + v.odometer, 0);
  const avgEfficiency = totalFuelLiters > 0
    ? (totalDistance / totalFuelLiters).toFixed(2)
    : '0';

  const vehicleStatusPie = [
    { name: 'Available', value: filteredVehicles.filter((v) => v.status === 'available').length },
    { name: 'On Trip', value: filteredVehicles.filter((v) => v.status === 'on_trip').length },
    { name: 'In Shop', value: filteredVehicles.filter((v) => v.status === 'in_shop').length },
    { name: 'Retired', value: filteredVehicles.filter((v) => v.status === 'retired').length },
  ].filter((d) => d.value > 0);

  const roiData = breakdowns
    .filter((b) => filteredVehicles.some((v) => v.id === b.vehicleId))
    .map((b) => {
      const v = vehicles.find((vv) => vv.id === b.vehicleId);
      const roi =
        v && v.acquisitionCost > 0
          ? ((v.revenue - b.totalCost) / v.acquisitionCost) * 100
          : 0;
      return {
        name: b.registrationNumber,
        ROI: parseFloat(roi.toFixed(1)),
        Revenue: b.revenue,
        Cost: b.totalCost,
      };
    })
    .sort((a, b) => b.ROI - a.ROI)
    .slice(0, 6);

  const topCostVehicles = [...breakdowns]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5)
    .map((b) => ({ name: b.registrationNumber, cost: b.totalCost, revenue: b.revenue }));

  function handleExport() {
    const csv = buildCsv(breakdowns, [
      { key: 'registrationNumber', label: 'Vehicle' },
      { key: 'vehicleName', label: 'Name' },
      { key: 'fuelCost', label: 'Fuel Cost' },
      { key: 'maintenanceCost', label: 'Maintenance Cost' },
      { key: 'otherCost', label: 'Other Cost' },
      { key: 'totalCost', label: 'Total Cost' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'profit', label: 'Profit' },
    ]);
    downloadCsv(csv, `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Analytics CSV exported');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fleet performance insights and financial reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="input-base py-2 w-auto"
          >
            <option value="">All Regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="input-base py-2 w-auto"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleExport} className="btn-primary text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Fuel Efficiency"
          value={`${avgEfficiency} km/L`}
          icon={Fuel}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          subtitle="Fleet average"
        />
        <KpiCard
          title="Fleet Utilization"
          value={`${stats?.fleetUtilization ?? 0}%`}
          icon={TrendingUp}
          iconColor="text-brand-600"
          iconBg="bg-brand-50 dark:bg-brand-900/20"
          subtitle="Active + In-shop / Total"
        />
        <KpiCard
          title="Operational Cost"
          value={formatCompact(operationalCost)}
          icon={DollarSign}
          iconColor="text-red-600"
          iconBg="bg-red-50 dark:bg-red-900/20"
          subtitle="Fuel + Maintenance"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCompact(totalRevenue)}
          icon={BarChart3}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          subtitle="Fleet-wide"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Pie */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Vehicle Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={vehicleStatusPie}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {vehicleStatusPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [`${v} vehicles`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {vehicleStatusPie.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-gray-500 dark:text-gray-400 truncate">{d.name}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Ranking */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Vehicle ROI Ranking</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'ROI']} />
              <Bar dataKey="ROI" radius={[0, 4, 4, 0]}>
                {roiData.map((entry, i) => (
                  <Cell key={i} fill={entry.ROI >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Fuel */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Monthly Revenue vs Fuel Cost</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="fuel" stroke="#ef4444" fill="url(#fuelGrad)" strokeWidth={2} name="Fuel Cost" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cost Vehicles */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Cost vs Revenue — Top Vehicles</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topCostVehicles}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
              <Legend />
              <Bar dataKey="cost" fill="#ef4444" name="Total Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="section-title">Vehicle Financial Summary</h3>
          <span className="text-xs text-gray-400">{breakdowns.length} vehicles</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Revenue</th>
                <th className="table-header">Fuel Cost</th>
                <th className="table-header">Maintenance</th>
                <th className="table-header">Other</th>
                <th className="table-header">Total Cost</th>
                <th className="table-header">Profit</th>
                <th className="table-header">ROI</th>
              </tr>
            </thead>
            <tbody>
              {breakdowns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                    No data yet. Complete trips to generate analytics.
                  </td>
                </tr>
              ) : (
                breakdowns.map((b) => {
                  const v = vehicles.find((vv) => vv.id === b.vehicleId);
                  const roi =
                    v && v.acquisitionCost > 0
                      ? ((v.revenue - b.totalCost) / v.acquisitionCost * 100).toFixed(1)
                      : '—';
                  return (
                    <tr key={b.vehicleId} className="table-row">
                      <td className="table-cell">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{b.registrationNumber}</p>
                        <p className="text-[11px] text-gray-400">{b.vehicleName}</p>
                      </td>
                      <td className="table-cell text-emerald-600 font-medium">{formatCurrency(b.revenue)}</td>
                      <td className="table-cell text-amber-600">{formatCurrency(b.fuelCost)}</td>
                      <td className="table-cell text-red-500">{formatCurrency(b.maintenanceCost)}</td>
                      <td className="table-cell text-gray-500">{formatCurrency(b.otherCost)}</td>
                      <td className="table-cell font-medium text-gray-800 dark:text-gray-200">{formatCurrency(b.totalCost)}</td>
                      <td className={`table-cell font-semibold ${b.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {b.profit >= 0 ? '+' : ''}{formatCurrency(b.profit)}
                      </td>
                      <td className={`table-cell font-semibold ${parseFloat(roi as string) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {roi}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
