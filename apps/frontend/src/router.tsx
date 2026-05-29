import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { EMRPage } from './pages/EMRPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { BillingPage } from './pages/BillingPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:id', element: <PatientDetailPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'emr', element: <EMRPage /> },
      { path: 'prescriptions', element: <PrescriptionsPage /> },
      { path: 'billing', element: <BillingPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
