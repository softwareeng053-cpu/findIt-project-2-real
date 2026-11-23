import React from 'react';
import { Bell, CheckCheck, Clock, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { DashboardSidebar } from '../components/DashboardSidebar';

export const StudentNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <DashboardSidebar mode="student" />

      <main className="flex-1 p-6 sm:p-10 max-w-5xl overflow-x-hidden">
        
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500 mt-1">
              Updates regarding your lost reports, found submissions, and claim verifications.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#635BFF] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-xs text-slate-400">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p>Your notification tray is clean.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !n.is_read ? 'bg-indigo-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.notification_type === 'item_returned'
                      ? 'bg-emerald-100 text-emerald-700'
                      : n.notification_type === 'claim_approved'
                      ? 'bg-indigo-100 text-[#635BFF]'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {n.notification_type === 'item_returned' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : n.notification_type === 'claim_approved' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h4 className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#635BFF] shrink-0 mt-2"></span>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
