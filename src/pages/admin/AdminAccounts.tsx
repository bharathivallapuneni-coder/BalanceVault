import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Layers, Search, RefreshCw, Landmark, ShieldCheck } from 'lucide-react';

export const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
      });

      const res = await api.get(`/api/admin/accounts?${queryParams.toString()}`);
      setAccounts(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Account Register</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory of customer accounts, assigned account references, and active standing.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search reference or user name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#173B75]"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#173B75]" />
            Loading account records...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No accounts found matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Account Reference</th>
                  <th className="py-3 px-6">Account Holder</th>
                  <th className="py-3 px-6">Classification</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6">KYC Status</th>
                  <th className="py-3 px-6">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#173B75] text-xs">
                      {acc.accountReference}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div>{acc.user?.fullName || 'Client Record'}</div>
                      <div className="text-xs text-slate-400 font-normal">{acc.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600 font-medium">
                      {acc.accountType?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={acc.status} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={acc.onboardingStatus} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {new Date(acc.createdAt).toLocaleDateString()}
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
          Page {page} of {totalPages || 1} • {totalCount} Total Accounts
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
    </div>
  );
};
