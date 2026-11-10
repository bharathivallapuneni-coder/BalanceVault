import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bell, CheckCheck, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

export const UserNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/notifications');
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/users/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            Account Activity
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Notifications & Official Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Security alerts, onboarding status determinations, and platform operational messages.
          </p>
        </div>

        <div className="p-3 bg-blue-50 text-[#173B75] rounded-xl flex items-center gap-2 border border-blue-100 self-start sm:self-auto">
          <Bell className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-bold">{unreadCount} Unread Alerts</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#173B75]" />
            Loading notifications feed...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            You do not have any notifications at this time.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex items-start justify-between gap-4 transition ${
                  n.isRead ? 'bg-white hover:bg-slate-50/60' : 'bg-blue-50/30 hover:bg-blue-50/50'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {!n.isRead ? (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-2 text-slate-400 hover:text-[#173B75] hover:bg-slate-100 rounded-lg transition shrink-0"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-md">
                    Read
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
