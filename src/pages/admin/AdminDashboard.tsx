import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#173B75]" />
        Loading live administrative metrics...
      </div>
    );
  }

  const stats = data?.stats || {};
  const chartData = data?.onboardingBreakdown || [
    { name: 'Pending Review', count: stats.pendingOnboarding || 0 },
    { name: 'Approved', count: stats.approvedOnboarding || 0 },
    { name: 'Rejected', count: stats.rejectedOnboarding || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Compliance & Operations Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform metrics, verification queue statuses, and immutable audit telemetry.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</span>
            <div className="p-2 bg-blue-50 text-[#173B75] rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalUsers || 0}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {stats.activeUsers || 0} Active accounts
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Requests</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{stats.pendingOnboarding || 0}</div>
          <Link
            to="/admin/onboarding"
            className="text-xs text-[#2563EB] hover:underline font-bold mt-2 flex items-center gap-1"
          >
            Review applications <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved KYC</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">{stats.approvedOnboarding || 0}</div>
          <div className="text-xs text-slate-400 font-medium mt-2">Active verified holders</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Accounts Managed</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalAccounts || 0}</div>
          <div className="text-xs text-slate-400 font-medium mt-2">
            {stats.activeAccounts || 0} active references
          </div>
        </div>
      </div>

      {/* Analytics Chart & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Distribution Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Onboarding Decisions</h3>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Live Breakdown</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" fontSize={11} stroke="#64748B" />
                  <YAxis allowDecimals={false} fontSize={11} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="count" fill="#173B75" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Rejected applications:</span>
            <span className="font-bold text-rose-600">{stats.rejectedOnboarding || 0}</span>
          </div>
        </div>

        {/* Real-Time Audit Activities Stream */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-slate-900">Recent Security & System Activities</h3>
              </div>
              <Link to="/admin/audit-logs" className="text-xs font-bold text-[#2563EB] hover:underline">
                View Full Audit Trail →
              </Link>
            </div>

            <div className="space-y-2.5">
              {(data?.recentActivities || []).slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 text-xs transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</span>
                      <StatusBadge status={log.result} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Actor: <span className="font-semibold text-slate-700">{log.actorEmail || 'System Core'}</span> • Target: <span className="font-medium text-slate-600">{log.targetType}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap text-right">
                    <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Protected against tampering • Passwords & tokens strictly scrubbed</span>
          </div>
        </div>
      </div>

      {/* Recent User Registrations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent User Registrations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest account holders registered on the platform</p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-bold text-[#173B75] hover:underline inline-flex items-center gap-1"
          >
            All Registered Users <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Account Holder</th>
                <th className="py-3 px-6">Account Reference</th>
                <th className="py-3 px-6">KYC Onboarding</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentUsers || []).map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    {u.fullName}
                    <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-xs text-[#173B75] font-bold">
                    {u.account?.accountReference || 'PENDING'}
                  </td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={u.onboarding?.status || 'PENDING'} />
                  </td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
