import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { getDefaultDashboardPath } from './utils/roleHelpers';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './components/layout/AppShell';

// Public pages
import IntakePage from './pages/public/IntakePage';
import IntakeSuccessPage from './pages/public/IntakeSuccessPage';
import StatusCheckPage from './pages/public/StatusCheckPage';
import LoginPage from './pages/auth/LoginPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import NotFoundPage from './pages/shared/NotFoundPage';

// Staff pages
import CaseManagerDashboard from './pages/case-manager/CaseManagerDashboard';
import ApplicationListPage from './pages/case-manager/ApplicationListPage';
import ApplicationDetailPage from './pages/case-manager/ApplicationDetailPage';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import PresidentDashboard from './pages/president/PresidentDashboard';
import TreasurerDashboard from './pages/treasurer/TreasurerDashboard';
import DisbursementsPage from './pages/treasurer/DisbursementsPage';
import DonationsPage from './pages/treasurer/DonationsPage';
import ReconciliationPage from './pages/treasurer/ReconciliationPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import FormBuilderPage from './pages/admin/FormBuilderPage';
import OrgSettingsPage from './pages/admin/OrgSettingsPage';
import ReportsPage from './pages/shared/ReportsPage';

const ALL_INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) return <Navigate to={getDefaultDashboardPath(user.role)} replace />;
  return <Navigate to="/apply/default" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/apply/:orgSlug" element={<IntakePage />} />
      <Route path="/apply/:orgSlug/success" element={<IntakeSuccessPage />} />
      <Route path="/status/:orgSlug" element={<StatusCheckPage />} />
      {/* Legacy redirects — old bookmarks go to default org */}
      <Route path="/apply" element={<Navigate to="/apply/default" replace />} />
      <Route path="/status" element={<Navigate to="/status/default" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Case Management — visible to all internal roles */}
          <Route path="/dashboard/cases" element={<ApplicationListPage />} />
          <Route path="/dashboard/cases/:id" element={<ApplicationDetailPage />} />

          {/* Role dashboards */}
          <Route
            path="/dashboard/home"
            element={<ProtectedRoute allowedRoles={['CASE_MANAGER']} />}
          >
            <Route index element={<CaseManagerDashboard />} />
          </Route>

          <Route path="/dashboard/compliance" element={
            <ProtectedRoute allowedRoles={['COMPLIANCE_OFFICER', 'ADMIN']} />
          }>
            <Route index element={<ComplianceDashboard />} />
          </Route>

          <Route path="/dashboard/president" element={
            <ProtectedRoute allowedRoles={['PRESIDENT', 'ADMIN']} />
          }>
            <Route index element={<PresidentDashboard />} />
          </Route>

          <Route path="/dashboard/treasurer" element={
            <ProtectedRoute allowedRoles={['TREASURER', 'ADMIN']} />
          }>
            <Route index element={<TreasurerDashboard />} />
          </Route>

          <Route path="/dashboard/disbursements" element={
            <ProtectedRoute allowedRoles={['TREASURER', 'ADMIN', 'PRESIDENT']} />
          }>
            <Route index element={<DisbursementsPage />} />
          </Route>

          <Route path="/dashboard/donations" element={
            <ProtectedRoute allowedRoles={['TREASURER', 'ADMIN', 'PRESIDENT']} />
          }>
            <Route index element={<DonationsPage />} />
          </Route>

          <Route path="/dashboard/reconciliation" element={
            <ProtectedRoute allowedRoles={['TREASURER', 'ADMIN', 'PRESIDENT']} />
          }>
            <Route index element={<ReconciliationPage />} />
          </Route>

          <Route path="/dashboard/reports" element={
            <ProtectedRoute allowedRoles={['PRESIDENT', 'TREASURER', 'ADMIN']} />
          }>
            <Route index element={<ReportsPage />} />
          </Route>

          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']} />
          }>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="/dashboard/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']} />
          }>
            <Route index element={<UserManagementPage />} />
          </Route>

          <Route path="/dashboard/form-builder" element={
            <ProtectedRoute allowedRoles={['ADMIN']} />
          }>
            <Route index element={<FormBuilderPage />} />
          </Route>

          <Route path="/dashboard/org-settings" element={
            <ProtectedRoute allowedRoles={['ADMIN']} />
          }>
            <Route index element={<OrgSettingsPage />} />
          </Route>

          {/* Catch-all dashboard redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDefaultDashboardPath(user?.role)} replace />;
}
