import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FileCheck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Lock,
  Landmark,
} from 'lucide-react';

export const UserOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  const [form, setForm] = useState({
    residentialAddress: '',
    dateOfBirth: '',
    identificationType: 'NATIONAL_ID',
    identificationNumber: '',
  });

  const fetchOnboarding = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/onboarding');
      if (res.onboarding) {
        setOnboarding(res.onboarding);
        setForm({
          residentialAddress: res.onboarding.residentialAddress || '',
          dateOfBirth: res.onboarding.dateOfBirth
            ? new Date(res.onboarding.dateOfBirth).toISOString().split('T')[0]
            : '',
          identificationType: res.onboarding.identificationType || 'NATIONAL_ID',
          identificationNumber: res.onboarding.identificationNumber || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.post('/api/users/onboarding', form);
      setOnboarding(res.onboarding);
      setMessage({
        text: 'Onboarding application successfully submitted! Your records are now queued for compliance verification.',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to submit onboarding application.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#173B75]" />
        Loading verification application...
      </div>
    );
  }

  const isApproved = onboarding?.status === 'APPROVED';
  const isPending = onboarding?.status === 'PENDING' || onboarding?.status === 'UNDER_REVIEW';
  const isRejected = onboarding?.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Overview Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            Compliance Lifecycle
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Identity & Account Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory KYC identity records to activate and safeguard your financial account reference.
          </p>
        </div>
        <StatusBadge status={onboarding?.status || 'PENDING'} />
      </div>

      {/* Progress Timeline Tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Verification Stage Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-emerald-800">1. Account Registered</span>
            <span className="text-[11px] text-slate-500 mt-1">Basic profile initialized</span>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 rounded-xl border flex flex-col items-center ${
              isApproved
                ? 'border-emerald-200 bg-emerald-50/60'
                : isPending
                ? 'border-amber-200 bg-amber-50/60'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <Clock
              className={`w-6 h-6 mb-2 ${
                isApproved ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
            <span
              className={`text-xs font-bold ${
                isApproved ? 'text-emerald-800' : isPending ? 'text-amber-800' : 'text-slate-600'
              }`}
            >
              2. Compliance Review
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {isApproved
                ? 'Review Approved'
                : isPending
                ? 'Currently Under Review'
                : 'Awaiting Document Submission'}
            </span>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 rounded-xl border flex flex-col items-center ${
              isApproved
                ? 'border-emerald-200 bg-emerald-50/60'
                : isRejected
                ? 'border-rose-200 bg-rose-50/60'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            {isRejected ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 mb-2" />
            ) : (
              <ShieldCheck
                className={`w-6 h-6 mb-2 ${isApproved ? 'text-emerald-600' : 'text-slate-400'}`}
              />
            )}
            <span
              className={`text-xs font-bold ${
                isApproved ? 'text-emerald-800' : isRejected ? 'text-rose-800' : 'text-slate-600'
              }`}
            >
              3. Full Account Activation
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {isApproved
                ? 'Reference Active'
                : isRejected
                ? 'Rejection Feedback Provided'
                : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Rejection Banner with Administrator Feedback */}
      {isRejected && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <h4 className="font-bold text-sm text-rose-900">
              Application Returned: Administrator Rejection Feedback
            </h4>
            <p className="text-rose-800 text-xs leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-200 font-mono">
              "{onboarding.rejectionReason}"
            </p>
            <p className="text-rose-700 text-[11px] pt-1">
              Please review the feedback above, update the requested fields in the form below, and resubmit for verification.
            </p>
          </div>
        </div>
      )}

      {/* Approved Status Banner */}
      {isApproved && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <h4 className="font-bold text-sm">Identity Verified & Account Approved</h4>
            <p className="text-emerald-700 text-xs mt-0.5">
              Your onboarding documentation has been evaluated and approved by compliance administration. Your account standing is ACTIVE.
            </p>
          </div>
        </div>
      )}

      {/* Status Alert Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Onboarding Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
          <FileCheck className="w-5 h-5 text-[#173B75]" />
          <h3 className="font-bold text-slate-900">Submitted Documentation Details</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Readonly Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                disabled
                value={user?.fullName || ''}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Verified Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Identification Document Type *
              </label>
              <select
                name="identificationType"
                value={form.identificationType}
                onChange={handleChange}
                disabled={isApproved || (isPending && !isRejected)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="NATIONAL_ID">National Identity Card</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Identification Document Number *
              </label>
              <input
                type="text"
                name="identificationNumber"
                required
                value={form.identificationNumber}
                onChange={handleChange}
                disabled={isApproved || (isPending && !isRejected)}
                placeholder="e.g. ID-89472911"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                required
                value={form.dateOfBirth}
                onChange={handleChange}
                disabled={isApproved || (isPending && !isRejected)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Residential Street Address *
              </label>
              <input
                type="text"
                name="residentialAddress"
                required
                value={form.residentialAddress}
                onChange={handleChange}
                disabled={isApproved || (isPending && !isRejected)}
                placeholder="Full residential street, city, state"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {!isApproved && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {isRejected
                  ? 'Resubmission will update status back to PENDING for re-evaluation.'
                  : 'All information is transmitted over authenticated channels.'}
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#173B75] hover:bg-[#122e5c] text-white font-bold rounded-xl shadow-md text-xs transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {isRejected ? 'Resubmit Verification' : 'Update & Submit'}
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
