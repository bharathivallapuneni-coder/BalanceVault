import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await api.get(`/api/admin/users?${queryParams.toString()}`);
      setUsers(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change user status to ${nextStatus}?`)) {
      return;
    }

    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: nextStatus });
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: nextStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleOpenDetail = async (userId: string) => {
    try {
      setDetailModalOpen(true);
      setLoadingDetail(true);
      const res = await api.get(`/api/admin/users/${userId}`);
      setSelectedUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch user details');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer accounts, verify permissions, and toggle access states. Total: {totalCount} users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#173B75]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="ACCOUNT_HOLDER">Account Holder</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#173B75]" />
            Loading registered users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No users found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">KYC Onboarding</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6">Registered Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{u.fullName}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-[#173B75]" />}
                        {u.role?.replace('_', ' ')}
                      </span>
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
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(u.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        title="View Full Profile Details"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>

                      <button
                        onClick={() => handleStatusToggle(u.id, u.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </button>
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
        <span>
          Page {page} of {totalPages || 1} • {totalCount} Total Registered
        </span>
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

      {/* User Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Account Holder Details"
        subtitle={`System ID: ${selectedUser?.id || ''}`}
        maxWidth="max-w-2xl"
      >
        {loadingDetail ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading user data...</div>
        ) : selectedUser ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {selectedUser.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {selectedUser.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedUser.status} />
                <span className="text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                  {selectedUser.role}
                </span>
              </div>
            </div>

            {/* Account & Onboarding Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <Layers className="w-4 h-4 text-[#173B75]" />
                  <span>Linked Financial Account</span>
                </div>
                <div className="text-sm font-mono font-bold text-[#173B75]">
                  {selectedUser.account?.accountReference || 'PENDING ASSIGNMENT'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Type: {selectedUser.account?.accountType || 'Standard'} • Status:{' '}
                  <span className="font-semibold">{selectedUser.account?.status || 'PENDING'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <FileCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Identity Onboarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedUser.onboarding?.status || 'PENDING'} />
                  <span className="text-xs text-slate-500">
                    ID: {selectedUser.onboarding?.identificationType || 'None'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 truncate">
                  Address: {selectedUser.onboarding?.residentialAddress || 'Not submitted'}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-[11px] text-slate-400">
                Created: {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => handleStatusToggle(selectedUser.id, selectedUser.status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedUser.status === 'ACTIVE'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {selectedUser.status === 'ACTIVE' ? 'Deactivate User Access' : 'Activate User Access'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
