import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  FileCheck,
  Search,
  Check,
  X,
  AlertCircle,
  Eye,
  Calendar,
  MapPin,
  CreditCard,
  User,
  RefreshCw,
} from 'lucide-react';

export const AdminOnboardingRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Detail inspection modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await api.get(`/api/admin/onboarding?${queryParams.toString()}`);
      setRequests(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, search, page]);

  const handleApprove = async (id: string, applicantName: string) => {
    if (!window.confirm(`Approve onboarding application for "${applicantName}" and activate their account?`)) {
      return;
    }

    try {
      await api.patch(`/api/admin/onboarding/${id}/approve`);
      fetchRequests();
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: 'APPROVED' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve onboarding.');
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason || rejectReason.trim().length < 5) {
      setRejectError('Please specify a rejection reason of at least 5 characters for applicant guidance.');
      return;
    }

    setIsSubmittingDecision(true);
    setRejectError('');
    try {
      await api.patch(`/api/admin/onboarding/${rejectId}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectModalOpen(false);
      fetchRequests();
      if (selectedRequest && selectedRequest.id === rejectId) {
        setSelectedRequest({
          ...selectedRequest,
          status: 'REJECTED',
          rejectionReason: rejectReason.trim(),
        });
      }
    } catch (err: any) {
      setRejectError(err.message || 'Failed to reject onboarding application.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleOpenDetail = (req: any) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Review Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted KYC identity documents and authorize account activations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by applicant or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#173B75]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#173B75]" />
            Loading onboarding submissions...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No onboarding applications match current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Applicant</th>
                  <th className="py-3 px-6">ID Type</th>
                  <th className="py-3 px-6">Residential Address</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Submission Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div>{req.user?.fullName || 'Registered User'}</div>
                      <div className="text-xs text-slate-400 font-normal">{req.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-700 font-medium">
                      {req.identificationType?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {req.residentialAddress}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(req)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id, req.user?.fullName || 'Applicant')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(req.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>Page {page} of {totalPages || 1}</span>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-50 transition"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Application Detail Inspection Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="KYC Onboarding Verification Record"
        subtitle={`Application ID: ${selectedRequest?.id || ''}`}
        maxWidth="max-w-xl"
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900">{selectedRequest.user?.fullName}</h4>
                <div className="text-xs text-slate-500">{selectedRequest.user?.email}</div>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">ID Document Type</span>
                <span className="font-bold text-slate-800">
                  {selectedRequest.identificationType?.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Document Identifier Number</span>
                <span className="font-mono font-bold text-[#173B75]">
                  {selectedRequest.identificationNumber || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Date of Birth</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequest.dateOfBirth
                    ? new Date(selectedRequest.dateOfBirth).toLocaleDateString()
                    : 'Not provided'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1">Submitted On</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedRequest.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block mb-1">Verified Residential Address</span>
              <span className="font-semibold text-slate-800">{selectedRequest.residentialAddress}</span>
            </div>

            {selectedRequest.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong className="block mb-0.5">Recorded Rejection Reason:</strong>
                <p>{selectedRequest.rejectionReason}</p>
                {selectedRequest.reviewedBy && (
                  <span className="text-[10px] text-rose-600 block mt-1">
                    Reviewed by: {selectedRequest.reviewedBy}
                  </span>
                )}
              </div>
            )}

            {selectedRequest.status === 'PENDING' && (
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenRejectModal(selectedRequest.id);
                  }}
                  className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs transition"
                >
                  Reject with Reason
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleApprove(selectedRequest.id, selectedRequest.user?.fullName);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                >
                  Approve & Activate Account
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Form Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Onboarding Application"
        subtitle="Please specify a concrete reason for compliance rejection"
      >
        <form onSubmit={handleSubmitRejection} className="space-y-4">
          {rejectError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {rejectError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Explanatory Reason for Applicant *
            </label>
            <textarea
              required
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Identification document expired or address proof unreadable. Please upload a clear valid copy."
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#173B75] focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              This message will be dispatched directly to the account holder's dashboard notification feed.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingDecision}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {isSubmittingDecision ? 'Submitting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
