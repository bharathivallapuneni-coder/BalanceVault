import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { ShieldAlert, Search, RefreshCw, Eye, Code, Terminal, Lock } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Metadata detail inspection
  const [inspectLog, setInspectLog] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        ...(actionFilter && { action: actionFilter }),
        ...(resultFilter && { result: resultFilter }),
      });

      const res = await api.get(`/api/admin/audit-logs?${queryParams.toString()}`);
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, resultFilter, page]);

  const handleInspect = (log: any) => {
    setInspectLog(log);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Operational Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system event telemetry. Passwords and sensitive identification numbers are strictly scrubbed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search actor, action, IP, target..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#173B75]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="USER_LOGIN_SUCCESS">Login Success</option>
            <option value="USER_LOGIN_FAILED">Login Failed</option>
            <option value="ONBOARDING_SUBMITTED">Onboarding Submitted</option>
            <option value="ONBOARDING_APPROVED">Onboarding Approved</option>
            <option value="ONBOARDING_REJECTED">Onboarding Rejected</option>
            <option value="USER_PASSWORD_CHANGED">Password Changed</option>
            <option value="USER_STATUS_ACTIVE">Status: Active</option>
            <option value="USER_STATUS_INACTIVE">Status: Inactive</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#173B75]" />
            Reading immutable audit stream...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No audit records found matching current query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Target</th>
                  <th className="py-3 px-6">Result</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap font-sans text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-semibold text-slate-800 font-sans text-xs truncate max-w-[180px]">
                      {log.actorEmail || 'System Core'}
                    </td>
                    <td className="py-3 px-6 text-[#173B75] font-bold">
                      {log.action}
                    </td>
                    <td className="py-3 px-6 text-slate-600 font-sans text-xs">
                      {log.targetType} {log.targetId ? `(#${log.targetId.slice(0, 10)})` : ''}
                    </td>
                    <td className="py-3 px-6">
                      <StatusBadge status={log.result} />
                    </td>
                    <td className="py-3 px-6 text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-6 text-right font-sans">
                      <button
                        onClick={() => handleInspect(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        <Code className="w-3.5 h-3.5" /> Payload
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
          Page {page} of {totalPages || 1} • {totalCount} Recorded Events
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

      {/* Inspect Event Payload Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Audit Event Specification"
        subtitle={`ID: ${inspectLog?.id || ''}`}
        maxWidth="max-w-2xl"
      >
        {inspectLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Action Code</span>
                <span className="font-mono font-bold text-[#173B75]">{inspectLog.action}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Outcome</span>
                <StatusBadge status={inspectLog.result} />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Actor Identity</span>
                <span className="font-semibold text-slate-800">{inspectLog.actorEmail || 'System / Daemon'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Origin Network</span>
                <span className="font-mono font-semibold text-slate-800">{inspectLog.ipAddress}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Sanitized Metadata Payload (JSON)</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <Lock className="w-3 h-3" /> Secrets Scrubbed
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(inspectLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 truncate">
              User-Agent: {inspectLog.userAgent}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
