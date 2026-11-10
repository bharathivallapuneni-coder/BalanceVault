import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  LayoutDashboard,
  FileCheck,
  User as UserIcon,
  Bell,
  LogOut,
  Landmark,
  Shield,
  Menu,
  X,
} from 'lucide-react';

export const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/users/notifications');
        const count = (res.notifications || []).filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      } catch {
        // silent
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/user/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/user/onboarding', label: 'Identity Onboarding', icon: FileCheck },
    { to: '/user/profile', label: 'Profile & Security', icon: UserIcon },
    {
      to: '/user/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
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
                Account Holder
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
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#2563EB] text-white border border-blue-300">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Security Shield Card */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Protected Account</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Encrypted session, RBAC-protected endpoints, and verified compliance oversight.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'AH'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                {user?.role?.replace('_', ' ')}
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
              Client Financial Portal
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-xs text-slate-500 hidden md:block">
              Ref: <span className="font-mono font-semibold text-slate-800">{user?.account?.accountReference || 'BV-INIT'}</span>
            </div>
            <StatusBadge status={user?.account?.status || 'PENDING_ONBOARDING'} />
          </div>
        </header>

        <main className="p-6 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
