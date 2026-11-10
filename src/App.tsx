import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminOnboardingRequests } from './pages/admin/AdminOnboardingRequests';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

import { UserLayout } from './layouts/UserLayout';
import { UserDashboard } from './pages/user/UserDashboard';
import { UserOnboarding } from './pages/user/UserOnboarding';
import { UserProfile } from './pages/user/UserProfile';
import { UserNotifications } from './pages/user/UserNotifications';

interface ProtectedRouteProps {
  allowedRoles: ('ADMIN' | 'ACCOUNT_HOLDER')[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center text-slate-500 text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#173B75] animate-ping" />
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication & Information */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="onboarding" element={<AdminOnboardingRequests />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* Account Holder Protected Routes */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['ACCOUNT_HOLDER']}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="onboarding" element={<UserOnboarding />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="notifications" element={<UserNotifications />} />
          </Route>

          {/* Wildcard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
