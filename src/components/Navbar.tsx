import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Shield, User, LogOut, FileText, CheckCircle2, ChevronDown, Menu, X, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* ZONE 1: BRAND ZONE */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] flex items-center justify-center text-white shadow-sm shadow-[#635BFF]/30 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#635BFF] transition-colors">
                Findlt
              </span>
            </div>
          </Link>

          {/* ZONE 2: PRIMARY NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                isActive('/') ? 'text-[#635BFF] font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                isActive('/browse') ? 'text-[#635BFF] font-semibold' : ''
              }`}
            >
              Browse Items
            </Link>
            <a
              href="/#how-it-works"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              How It Works
            </a>
            <a
              href="/#about"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              About Campus Security
            </a>
            {isAuthenticated && !isAdmin && (
              <Link
                to="/student/dashboard"
                className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                  location.pathname.startsWith('/student') ? 'text-[#635BFF] font-semibold' : ''
                }`}
              >
                Student Portal
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap text-amber-700 hover:text-amber-800 font-semibold ${
                  location.pathname.startsWith('/admin') ? 'text-amber-900' : ''
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* ZONE 3: PRIMARY ACTION / AUTH & NOTIFICATION ZONE */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Quick Report Button */}
                <Link
                  to="/report-found"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                  Turn In Item
                </Link>

                {/* Notifications Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center tabular-nums shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs text-rose-600 font-medium">{unreadCount} unread</span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-[#635BFF] hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.is_read ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap tabular-nums">
                                  {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#635BFF] font-bold text-xs flex items-center justify-center border border-indigo-200">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                        {user?.full_name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {user?.role === 'admin' ? 'Campus Admin' : user?.campus_id}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <p className="text-[10px] font-mono text-[#635BFF] mt-0.5">{user?.department}</p>
                      </div>

                      {user?.role === 'admin' ? (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Shield className="w-4 h-4 text-amber-600" />
                            Admin Control Console
                          </Link>
                          <Link
                            to="/admin/claims"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Review Claims
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/student/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <User className="w-4 h-4 text-indigo-600" />
                            Student Dashboard
                          </Link>
                          <Link
                            to="/student/reports"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-4 h-4 text-slate-500" />
                            My Reports
                          </Link>
                          <Link
                            to="/student/claims"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            My Claims
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-[#635BFF]/30"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Items
          </Link>
          <Link
            to="/report-lost"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Report Lost Item
          </Link>
          <Link
            to="/report-found"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Report Found Item
          </Link>
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to="/student/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#635BFF] hover:bg-indigo-50"
                >
                  Student Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#635BFF] rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
