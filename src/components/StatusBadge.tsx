import React from 'react';

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  SUCCESS: {
    label: 'Success',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  PENDING_ONBOARDING: {
    label: 'Pending Onboarding',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  FAILURE: {
    label: 'Failure',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'bg-rose-100 text-rose-800 border-rose-300',
  },
};

export const StatusBadge: React.FC<{ status?: string; className?: string }> = ({
  status = 'UNKNOWN',
  className = '',
}) => {
  const normalizedKey = status.toUpperCase();
  const config = statusConfig[normalizedKey] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {config.label}
    </span>
  );
};
