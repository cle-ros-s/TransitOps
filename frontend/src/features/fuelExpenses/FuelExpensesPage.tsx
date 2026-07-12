import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fuel, DollarSign, Trash2, Plus, BarChart3 } from 'lucide-react';
import { getFuelLogs, getExpenses, getVehicleCostBreakdowns, deleteFuelLog, deleteExpense } from '../../mockApi/fuelExpenseApi';
import { getVehicles } from '../../mockApi/vehicleApi';
import { getTrips } from '../../mockApi/tripApi';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FuelLogForm } from './FuelLogForm';
import { ExpenseForm } from './ExpenseForm';
import { usePermissions } from '../../hooks/usePermissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export function FuelExpensesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [tab, setTab] = useState<'fuel' | 'expenses' | 'breakdown'>('fuel');
  const [fuelFormOpen, setFuelFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [deleteFuelTarget, setDeleteFuelTarget] = useState<string | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<string | null>(null);

  const { data: fuelLogs = [] } = useQuery({ queryKey: ['fuel-logs'], queryFn: getFuelLogs });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses });
  const { data: breakdowns = [] } = useQuery({ queryKey: ['cost-breakdowns'], queryFn: getVehicleCostBreakdowns });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: trips = [] } = useQuery({ queryKey: ['trips'], queryFn: getTrips });

  const getVehicleName = (id: string) => vehicles.find((v) => v.id === id)?.registrationNumber ?? id;
  const getTripNumber = (id: string) => trips.find((t) => t.id === id)?.tripNumber ?? '—';

  const deleteFuelMutation = useMutation({
    mutationFn: deleteFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['cost-breakdowns'] });
      toast.success('Fuel log deleted');
      setDeleteFuelTarget(null);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cost-breakdowns'] });
      toast.success('Expense deleted');
      setDeleteExpenseTarget(null);
    },
  });

  const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.totalCost, 0);

  const chartData = breakdowns.slice(0, 6).map((b) => ({
    name: b.registrationNumber,
    Fuel: Math.round(b.fuelCost),
    Maintenance: Math.round(b.maintenanceCost),
    Other: Math.round(b.otherCost),
  }));

  const tabs = [
    { key: 'fuel', label: 'Fuel Logs', count: fuelLogs.length },
    { key: 'expenses', label: 'Expenses', count: expenses.length },
    { key: 'breakdown', label: 'Cost Breakdown', count: breakdowns.length },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fuel & Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fuel: {formatCurrency(totalFuel)} · Expenses: {formatCurrency(totalExpenses)}
          </p>
        </div>
        {can.fuel && (
          <div className="flex gap-2">
            <button onClick={() => setFuelFormOpen(true)} className="btn-secondary text-sm">
              <Fuel className="w-4 h-4" /> Add Fuel Log
            </button>
            <button onClick={() => setExpenseFormOpen(true)} className="btn-primary text-sm">
              <DollarSign className="w-4 h-4" /> Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Fuel Logs */}
      {tab === 'fuel' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Liters</th>
                  <th className="table-header">₹/Liter</th>
                  <th className="table-header">Total Cost</th>
                  <th className="table-header">Odometer</th>
                  <th className="table-header">Station</th>
                  <th className="table-header">Trip</th>
                  {can.fuel && <th className="table-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={Fuel} title="No fuel logs yet" description="Add fuel logs manually or complete a trip" /></td></tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell font-semibold">{getVehicleName(log.vehicleId)}</td>
                      <td className="table-cell text-gray-500">{formatDate(log.date)}</td>
                      <td className="table-cell">{log.liters} L</td>
                      <td className="table-cell">₹{log.costPerLiter}/L</td>
                      <td className="table-cell font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(log.totalCost)}</td>
                      <td className="table-cell">{log.odometer.toLocaleString()} km</td>
                      <td className="table-cell text-gray-400 text-xs">{log.fuelStation ?? '—'}</td>
                      <td className="table-cell text-xs">{log.tripId ? getTripNumber(log.tripId) : '—'}</td>
                      {can.fuel && (
                        <td className="table-cell">
                          <button
                            onClick={() => setDeleteFuelTarget(log.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Vehicle</th>
                  <th className="table-header">Trip</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Toll</th>
                  <th className="table-header">Maintenance</th>
                  <th className="table-header">Other</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Description</th>
                  {can.fuel && <th className="table-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={DollarSign} title="No expenses logged" description="Expenses are auto-created on trip completion" /></td></tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="table-row">
                      <td className="table-cell font-semibold">{getVehicleName(exp.vehicleId)}</td>
                      <td className="table-cell text-brand-600 dark:text-brand-400 font-medium">{getTripNumber(exp.tripId)}</td>
                      <td className="table-cell text-gray-500">{formatDate(exp.date)}</td>
                      <td className="table-cell">{formatCurrency(exp.toll)}</td>
                      <td className="table-cell">{formatCurrency(exp.maintenanceCost)}</td>
                      <td className="table-cell">{formatCurrency(exp.otherExpenses)}</td>
                      <td className="table-cell font-semibold text-red-600 dark:text-red-400">{formatCurrency(exp.totalCost)}</td>
                      <td className="table-cell text-gray-400 text-xs max-w-48 truncate">{exp.description ?? '—'}</td>
                      {can.fuel && (
                        <td className="table-cell">
                          <button
                            onClick={() => setDeleteExpenseTarget(exp.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {tab === 'breakdown' && (
        <div className="space-y-4">
          {breakdowns.length === 0 ? (
            <div className="card">
              <EmptyState icon={BarChart3} title="No cost data yet" description="Complete trips and add fuel logs to see breakdowns" />
            </div>
          ) : (
            <>
              <div className="card p-5">
                <h3 className="section-title mb-4">Stacked Cost per Vehicle</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
                    <Legend />
                    <Bar dataKey="Fuel" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Maintenance" stackId="a" fill="#ef4444" />
                    <Bar dataKey="Other" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {breakdowns.map((b) => (
                  <div key={b.vehicleId} className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{b.registrationNumber}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        b.profit >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      }`}>
                        {b.profit >= 0 ? '+' : ''}{formatCurrency(b.profit)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{b.vehicleName}</p>
                    <div className="space-y-1 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fuel</span>
                        <span className="text-amber-600">{formatCurrency(b.fuelCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Maintenance</span>
                        <span className="text-red-500">{formatCurrency(b.maintenanceCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Other</span>
                        <span className="text-gray-600 dark:text-gray-400">{formatCurrency(b.otherCost)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-gray-100 dark:border-gray-800 pt-1">
                        <span className="text-gray-600 dark:text-gray-400">Total Cost</span>
                        <span className="text-gray-800 dark:text-gray-200">{formatCurrency(b.totalCost)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-500">Revenue</span>
                        <span className="text-emerald-600">{formatCurrency(b.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {fuelFormOpen && (
        <FuelLogForm
          vehicles={vehicles}
          onClose={() => setFuelFormOpen(false)}
          onSuccess={() => {
            setFuelFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
            queryClient.invalidateQueries({ queryKey: ['cost-breakdowns'] });
          }}
        />
      )}
      {expenseFormOpen && (
        <ExpenseForm
          vehicles={vehicles}
          trips={trips}
          onClose={() => setExpenseFormOpen(false)}
          onSuccess={() => {
            setExpenseFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['cost-breakdowns'] });
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteFuelTarget}
        title="Delete Fuel Log"
        message="Delete this fuel log entry? This cannot be undone."
        variant="danger"
        onConfirm={() => deleteFuelTarget && deleteFuelMutation.mutate(deleteFuelTarget)}
        onCancel={() => setDeleteFuelTarget(null)}
      />
      <ConfirmDialog
        isOpen={!!deleteExpenseTarget}
        title="Delete Expense"
        message="Delete this expense record? This cannot be undone."
        variant="danger"
        onConfirm={() => deleteExpenseTarget && deleteExpenseMutation.mutate(deleteExpenseTarget)}
        onCancel={() => setDeleteExpenseTarget(null)}
      />
    </div>
  );
}
