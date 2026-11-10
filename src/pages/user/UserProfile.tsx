import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, KeyRound, Check, AlertCircle, Shield, RefreshCw, Lock } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    setIsUpdatingProfile(true);

    try {
      await api.put('/api/users/profile', {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
      });
      await refreshUser();
      setProfileMessage({ text: 'Personal profile details updated successfully.', type: 'success' });
    } catch (err: any) {
      setProfileMessage({
        text: err.message || 'Failed to update personal details.',
        type: 'error',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      setPasswordMessage({
        text: 'Password changed successfully. Your next session will require the new credentials.',
        type: 'success',
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      setPasswordMessage({
        text: err.message || 'Failed to update password.',
        type: 'error',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
          Settings
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal credentials, contact parameters, and security authentication keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <User className="w-5 h-5 text-[#173B75]" />
              <h3 className="font-bold text-slate-900">Personal Information</h3>
            </div>

            {profileMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Email is locked to primary account reference identity.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 bg-[#173B75] hover:bg-[#122e5c] text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving Details...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-slate-900">Change Password</h3>
            </div>

            {passwordMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
