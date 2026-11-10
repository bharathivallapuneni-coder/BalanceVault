import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Layers,
  ShieldAlert,
  LogOut,
  Landmark,
  Activity,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSystemReady, setIsSystemReady] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const [dashRes, readyRes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/ready'),
        ]);
        setPendingCount(dashRes.stats?.pendingOnboarding || 0);
        setIsSystemReady(readyRes.status === 'READY');
      } catch {
        setIsSystemReady(false);
      }
    };
    fetchQuickStats();
    const interval = setInterval(fetchQuickStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    {
      to: '/admin/onboarding',
      label: 'Onboarding Queue',
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { to: '/admin/accounts', label: 'Accounts Register', icon: Layers },
    { to: '/admin/audit-logs', label: 'Security Audit Trail', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#101D36] text-slate-300 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#173B75] text-white rounded-xl shadow-md border border-blue-500/30">
              <Landmark className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-white tracking-tight">BalanceVault</div>
              <div className="text-[10px] tracking-wider uppercase text-blue-400 font-semibold">
                Compliance Admin
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-xs">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Health Status Indicator */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Core API Engine:</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSystemReady
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
              {isSystemReady ? 'READY' : 'PROBING'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">PostgreSQL + Rate Limiter Active</div>
        </div>

        {/* Administrator Profile Card */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-9 h-9 rounded-xl bg-[#173B75] text-blue-200 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-400/20">
              AD
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                RBAC: {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-bold text-slate-800 hidden sm:block">
              BalanceVault Administrator Console
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Session Authenticated</span>
            </div>
          </div>
        </header>

        <main className="p-6 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
