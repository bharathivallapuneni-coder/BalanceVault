import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Landmark,
  Shield,
  FileCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, onbRes, notifRes] = await Promise.all([
          api.get('/api/users/account'),
          api.get('/api/users/onboarding'),
          api.get('/api/users/notifications'),
        ]);
        setAccount(accRes.account);
        setOnboarding(onbRes.onboarding);
        setNotifications((notifRes.notifications || []).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#173B75]" />
        Loading your account dashboard...
      </div>
    );
  }

  const isApproved = onboarding?.status === 'APPROVED';
  const isRejected = onboarding?.status === 'REJECTED';
  const isPending = onboarding?.status === 'PENDING' || onboarding?.status === 'UNDER_REVIEW';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            Welcome Back
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Account Reference ID:{' '}
            <span className="font-mono font-bold text-[#173B75]">
              {account?.accountReference || 'PENDING'}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 block mb-0.5">Account Status:</span>
            <StatusBadge status={account?.status || 'PENDING_ONBOARDING'} />
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 block mb-0.5">KYC Status:</span>
            <StatusBadge status={onboarding?.status || 'PENDING'} />
          </div>
        </div>
      </div>

      {/* Onboarding Callout Banner if not approved */}
      {isRejected && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Action Required: Identity Verification Rejected
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Reason: "{onboarding.rejectionReason}". Please update your records and resubmit.
              </p>
            </div>
          </div>
          <Link
            to="/user/onboarding"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
          >
            Review & Resubmit Now
          </Link>
        </div>
      )}

      {isPending && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Compliance Verification in Progress
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Your onboarding documentation has been submitted and is currently being evaluated by our compliance administrators.
              </p>
            </div>
          </div>
          <Link
            to="/user/onboarding"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
          >
            Check Status
          </Link>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-50 text-[#173B75] rounded-xl border border-blue-100">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Account Reference Standing</h3>
                <p className="text-xs text-slate-500">Classification & standing parameters</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Account Reference:</span>
                <span className="font-mono font-bold text-[#173B75]">
                  {account?.accountReference || 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Account Classification:</span>
                <span className="font-semibold text-slate-800">
                  {account?.accountType?.replace('_', ' ') || 'Standard Checking'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Account Standing:</span>
                <StatusBadge status={account?.status || 'PENDING_ONBOARDING'} />
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Profile Initialized:</span>
                <span className="font-semibold text-slate-800">
                  {account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">BalanceVault Governance</span>
            <Link
              to="/user/profile"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              Account Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Identity & Compliance</h3>
                <p className="text-xs text-slate-500">KYC onboarding status and verification</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Onboarding Status:</span>
                <StatusBadge status={onboarding?.status || 'PENDING'} />
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Document Classification:</span>
                <span className="font-semibold text-slate-800">
                  {onboarding?.identificationType?.replace('_', ' ') || 'Not Specified'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-semibold text-slate-800">
                  {onboarding?.dateOfBirth ? new Date(onboarding.dateOfBirth).toLocaleDateString() : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Submitted On:</span>
                <span className="font-semibold text-slate-800">
                  {onboarding?.submittedAt ? new Date(onboarding.submittedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isApproved ? 'Full Privileges Unlocked' : 'Verification Mandatory'}
            </span>
            <Link
              to="/user/onboarding"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              Manage Onboarding <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#173B75]" />
            <h3 className="text-sm font-bold text-slate-900">Recent Official Notifications</h3>
          </div>
          <Link to="/user/notifications" className="text-xs font-bold text-[#2563EB] hover:underline">
            View All ({notifications.length}) →
          </Link>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active notifications in your feed.
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-4 transition ${
                  n.isRead
                    ? 'bg-slate-50/70 border-slate-100'
                    : 'bg-blue-50/40 border-blue-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    {!n.isRead && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#2563EB] text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1">{n.message}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
