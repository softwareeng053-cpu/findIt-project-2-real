import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  FileText,
  CheckCircle2,
  Bell,
  Users,
  Shield,
  Layers,
  Settings,
  LogOut,
  FolderOpen,
  FileQuestion,
  PackageCheck,
  Award,
  History,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  mode: 'student' | 'admin';
}

interface SidebarLinkItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ mode }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks: SidebarLinkItem[] = [
    { to: '/student/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/browse', label: 'Browse Directory', icon: Search },
    { to: '/report-lost', label: 'Report Lost Item', icon: PlusCircle },
    { to: '/report-found', label: 'Report Found Item', icon: FolderOpen },
    { to: '/student/reports', label: 'My Reports', icon: FileText },
    { to: '/student/claims', label: 'My Claims', icon: CheckCircle2 },
    { to: '/student/notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
  ];

  // Exact 10 items for Super Admin Navigation as required by Section 13 (+ Logout button)
  const adminLinks: SidebarLinkItem[] = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/lost-items', label: 'Lost Items', icon: FileQuestion },
    { to: '/admin/found-items', label: 'Found Items', icon: PackageCheck },
    { to: '/admin/claims', label: 'Claims', icon: CheckCircle2 },
    { to: '/admin/returned-items', label: 'Returned Items', icon: Award },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/admin/logs', label: 'Activity Logs', icon: History },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const links = mode === 'admin' ? adminLinks : studentLinks;

  if (mode === 'admin') {
    return (
      <aside className="w-64 shrink-0 bg-[#0F172A] border-r border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 text-slate-300">
        <div className="px-4 space-y-6">
          {/* Admin Identity Card */}
          <div className="p-3.5 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Admin Officer'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] font-mono text-slate-400 truncate uppercase tracking-wider">
                  Super Admin
                </p>
              </div>
            </div>
          </div>

          {/* Section Heading & Navigation */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Control Panel
            </span>
            <nav className="mt-2 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#635BFF] text-white font-semibold shadow-md shadow-[#635BFF]/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap truncate">{link.label}</span>
                    </div>
                    {link.badge && link.badge > 0 ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full tabular-nums">
                        {link.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Logout Button (#11) */}
        <div className="px-4 pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    );
  }

  // Student Sidebar
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6">
      <div className="px-4 space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-[#635BFF] border border-indigo-200 flex items-center justify-center font-bold text-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
            <p className="text-[11px] font-mono text-slate-500 truncate">
              {user?.campus_id}
            </p>
          </div>
        </div>

        {/* Section Heading */}
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Student Workspace
          </span>
          <nav className="mt-2 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/student/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-[#635BFF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">{link.label}</span>
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full tabular-nums">
                      {link.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer controls */}
      <div className="px-4 pt-4 border-t border-slate-100 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
