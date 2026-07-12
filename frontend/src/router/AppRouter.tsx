import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PageLoader } from '../components/common/PageLoader';

const LoginPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const VehicleRegistryPage = lazy(() => import('../features/fleet/VehicleRegistryPage').then(m => ({ default: m.VehicleRegistryPage })));
const DriversPage = lazy(() => import('../features/drivers/DriversPage').then(m => ({ default: m.DriversPage })));
const TripDispatcherPage = lazy(() => import('../features/trips/TripDispatcherPage').then(m => ({ default: m.TripDispatcherPage })));
const MaintenancePage = lazy(() => import('../features/maintenance/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const FuelExpensesPage = lazy(() => import('../features/fuelExpenses/FuelExpensesPage').then(m => ({ default: m.FuelExpensesPage })));
const AnalyticsPage = lazy(() => import('../features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehicleRegistryPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/trips" element={<TripDispatcherPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
