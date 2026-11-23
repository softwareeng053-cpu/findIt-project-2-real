import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  FileText,
  FolderOpen,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Layers,
  Settings,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Bell,
  Send,
  History,
  FileQuestion,
  PackageCheck,
  Building,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Info,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  api,
  UserProfile,
  Item,
  Claim,
  AdminActivityLog,
  SystemSettings,
  ReturnedItemRecord,
  UserDetailsResponse
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Modal } from '../components/Modal';

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Determine active tab from URL path
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/lost-items') || path.includes('/admin/reports/lost')) return 'lost';
    if (path.includes('/admin/found-items') || path.includes('/admin/reports/found')) return 'found';
    if (path.includes('/admin/claims')) return 'claims';
    if (path.includes('/admin/returned-items') || path.includes('/admin/handover')) return 'returned';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/notifications')) return 'notifications';
    if (path.includes('/admin/logs')) return 'logs';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  }, [location.pathname]);

  const [loading, setLoading] = useState(true);

  // Live Stats from DB
  const [stats, setStats] = useState({
    total_users: 0,
    total_lost: 0,
    total_found: 0,
    active_reports: 0,
    pending_claims: 0,
    approved_claims: 0,
    rejected_claims: 0,
    returned_items: 0,
    blocked_users: 0
  });

  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [claimDistribution, setClaimDistribution] = useState<any[]>([]);
  const [userDeptDistribution, setUserDeptDistribution] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [latestReports, setLatestReports] = useState<Item[]>([]);
  const [recentClaimsList, setRecentClaimsList] = useState<Claim[]>([]);

  // Users Tab
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetailsResponse | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Lost & Found Items Tab
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');
  const [itemStatusFilter, setItemStatusFilter] = useState('all');
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);
  const [editFormData, setEditFormData] = useState({
    item_name: '',
    category: '',
    description: '',
    location: '',
    status: 'open'
  });
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; location: string } | null>(null);

  // Claims Tab
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected' | 'Under Review'>('Approved');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Handover Modal
  const [handoverClaim, setHandoverClaim] = useState<Claim | null>(null);
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Returned Items Tab
  const [returnedItems, setReturnedItems] = useState<ReturnedItemRecord[]>([]);
  const [returnedSearch, setReturnedSearch] = useState('');

  // Categories Tab
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catFormData, setCatFormData] = useState({ category_name: '', description: '', is_active: true });

  // Notifications Tab
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    notification_type: 'announcement'
  });
  const [directNotifyUser, setDirectNotifyUser] = useState<UserProfile | null>(null);
  const [directNotifyData, setDirectNotifyData] = useState({
    title: '',
    message: '',
    notification_type: 'update'
  });

  // Activity Logs Tab
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');

  // System Settings Tab
  const [settings, setSettings] = useState<SystemSettings>({
    id: 'settings-default',
    system_name: 'Findlt – Campus Lost & Found System',
    college_name: 'Apex Institute of Technology',
    security_hotline: '+1 (555) 019-2834',
    central_office: 'Campus Security HQ - Building B, Room 104',
    contact_email: 'lostandfound@campus.edu',
    operating_hours: 'Mon - Fri: 8:00 AM - 6:00 PM | Sat: 9:00 AM - 1:00 PM',
    item_retention_days: 90,
    auto_approve_claims: false,
    updated_at: new Date().toISOString()
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        dashRes,
        usersRes,
        itemsRes,
        claimsRes,
        catRes,
        returnedRes,
        logsRes,
        settingsRes,
        notifRes
      ] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAdminItems(),
        api.getAdminClaims(),
        api.getAdminCategories(),
        api.getReturnedItems(),
        api.getAdminLogs(),
        api.getAdminSettings(),
        api.getNotifications()
      ]);

      if (dashRes.stats) setStats(dashRes.stats);
      setMonthlyReports(dashRes.monthly_reports || []);
      setClaimDistribution(dashRes.claim_distribution || []);
      setUserDeptDistribution(dashRes.user_department_distribution || []);
      setRecentActivities(dashRes.recent_activities || []);
      setLatestReports(dashRes.latest_reports || []);
      setRecentClaimsList(dashRes.recent_claims || []);

      setUsers(usersRes.users || []);
      setItems(itemsRes.items || []);
      setClaims(claimsRes.claims || []);
      setCategories(catRes.categories || catRes || []);
      setReturnedItems(returnedRes.returned_items || []);
      setLogs(logsRes.logs || []);
      if (settingsRes.settings) setSettings(settingsRes.settings);
      setNotificationsList(notifRes.notifications || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      toast.error('Permission Warning', 'Could not load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const switchTab = (tabRoute: string) => {
    navigate(tabRoute);
  };

  // User Actions
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    // Guard against self-suspension
    if (user?.id === targetUser.id) {
      toast.error('Security Constraint', 'You cannot suspend your own administrator account.');
      return;
    }

    const nextStatus = targetUser.account_status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(targetUser.id, { status: nextStatus });
      toast.success(
        'Account Status Updated',
        `${targetUser.full_name} is now ${nextStatus === 'active' ? 'Active' : 'Suspended'}`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, account_status: nextStatus } : u))
      );
      loadData();
    } catch (err: any) {
      toast.error('Action Restricted', err.response?.data?.error || 'Could not update user status.');
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    // Guard against self-demotion
    if (user?.id === targetUser.id) {
      toast.error('Security Constraint', 'You cannot remove your own administrator privileges.');
      return;
    }

    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    try {
      await api.updateUserStatus(targetUser.id, { role: nextRole });
      toast.success(
        'User Role Updated',
        `${targetUser.full_name} is now granted ${nextRole.toUpperCase()} permissions.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
      loadData();
    } catch (err: any) {
      toast.error('Action Restricted', err.response?.data?.error || 'Could not update user role.');
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    setLoadingUserDetails(true);
    try {
      const details = await api.getAdminUserDetails(userId);
      setSelectedUserDetails(details);
    } catch (err: any) {
      toast.error('Query Error', 'Unable to fetch user report and claim history.');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Item Actions
  const handleOpenEditItem = (item: Item) => {
    setSelectedItemForEdit(item);
    setEditFormData({
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      location: item.location,
      status: item.status
    });
  };

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;

    try {
      await api.updateAdminItem(selectedItemForEdit.id, editFormData);
      toast.success('Record Updated', `Successfully updated "${editFormData.item_name}"`);
      setSelectedItemForEdit(null);
      loadData();
    } catch (err: any) {
      toast.error('Update Failed', err.response?.data?.error || 'Could not save item updates.');
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${itemName}"? This action is audited.`)) {
      return;
    }

    try {
      await api.deleteAdminItem(itemId);
      toast.success('Item Deleted', `"${itemName}" was removed from campus records.`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      loadData();
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Could not delete item.');
    }
  };

  // Claims & Review
  const openReviewModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewStatus(claim.status === 'Pending' ? 'Approved' : (claim.status as any));
    setAdminRemarks(claim.admin_remarks || '');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmittingReview(true);
    try {
      await api.reviewClaim(selectedClaim.id, {
        status: reviewStatus,
        admin_remarks: adminRemarks
      });
      toast.success('Claim Processed', `Claim marked as ${reviewStatus}`);
      setSelectedClaim(null);
      loadData();
    } catch (err: any) {
      toast.error('Review Error', err.response?.data?.error || 'Could not review claim');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Physical Handover
  const openHandoverModal = (claim: Claim) => {
    setHandoverClaim(claim);
    setHandoverRemarks(
      `Physical campus ID inspected for ${claim.claimant_name} (${claim.claimant_campus_id}). Ownership verified and item returned.`
    );
  };

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverClaim) return;
    setSubmittingHandover(true);
    try {
      await api.recordHandover({
        item_id: handoverClaim.item_id,
        claim_id: handoverClaim.id,
        remarks: handoverRemarks
      });

      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 }
      });

      toast.success('Handover Verified! 🎉', 'Article returned to student. Immutable custody certificate created.');
      setHandoverClaim(null);
      loadData();
    } catch (err: any) {
      toast.error('Handover Failed', err.response?.data?.error || 'Could not complete handover');
    } finally {
      setSubmittingHandover(false);
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatFormData({ category_name: '', description: '', is_active: true });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCatFormData({
      category_name: cat.category_name,
      description: cat.description || '',
      is_active: cat.is_active !== undefined ? cat.is_active : true
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.category_name.trim()) return;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, catFormData);
        toast.success('Category Updated', `Updated "${catFormData.category_name}"`);
      } else {
        await api.addCategory({
          category_name: catFormData.category_name.trim(),
          description: catFormData.description.trim()
        });
        toast.success('Category Created', `New category "${catFormData.category_name}" is active.`);
      }
      setCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Error', err.response?.data?.error || 'Could not save category.');
    }
  };

  // Broadcast & Notifications
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message) return;

    try {
      await api.sendBroadcast(broadcastData);
      toast.success('Announcement Dispatched', 'Broadcast alert sent to all student dashboards.');
      setBroadcastModalOpen(false);
      setBroadcastData({ title: '', message: '', notification_type: 'announcement' });
      loadData();
    } catch (err: any) {
      toast.error('Broadcast Error', err.response?.data?.error || 'Failed to dispatch broadcast.');
    }
  };

  const handleSendDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directNotifyUser || !directNotifyData.title || !directNotifyData.message) return;

    try {
      await api.sendDirectNotification({
        user_id: directNotifyUser.id,
        title: directNotifyData.title,
        message: directNotifyData.message,
        notification_type: directNotifyData.notification_type
      });
      toast.success('Notification Sent', `Direct alert delivered to ${directNotifyUser.full_name}.`);
      setDirectNotifyUser(null);
      setDirectNotifyData({ title: '', message: '', notification_type: 'update' });
      loadData();
    } catch (err: any) {
      toast.error('Send Error', err.response?.data?.error || 'Could not deliver notification.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateAdminSettings(settings);
      toast.success('System Settings Saved', 'Campus configuration and protocols updated.');
      loadData();
    } catch (err: any) {
      toast.error('Settings Error', err.response?.data?.error || 'Could not update system settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered views
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.campus_id.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchDept = userDeptFilter === 'all' || u.department === userDeptFilter;
      const matchStatus = userStatusFilter === 'all' || u.account_status === userStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [users, userSearch, userDeptFilter, userStatusFilter]);

  const lostItems = useMemo(() => {
    return items.filter((i) => i.item_type === 'lost');
  }, [items]);

  const foundItems = useMemo(() => {
    return items.filter((i) => i.item_type === 'found');
  }, [items]);

  const filteredLostItems = useMemo(() => {
    return lostItems.filter((i) => {
      const matchSearch =
        i.item_name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.location.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (i.brand && i.brand.toLowerCase().includes(itemSearch.toLowerCase()));
      const matchCat = itemCategoryFilter === 'all' || i.category === itemCategoryFilter;
      const matchStatus = itemStatusFilter === 'all' || i.status === itemStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [lostItems, itemSearch, itemCategoryFilter, itemStatusFilter]);

  const filteredFoundItems = useMemo(() => {
    return foundItems.filter((i) => {
      const matchSearch =
        i.item_name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.location.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (i.brand && i.brand.toLowerCase().includes(itemSearch.toLowerCase()));
      const matchCat = itemCategoryFilter === 'all' || i.category === itemCategoryFilter;
      const matchStatus = itemStatusFilter === 'all' || i.status === itemStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [foundItems, itemSearch, itemCategoryFilter, itemStatusFilter]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchSearch =
        (c.item_name && c.item_name.toLowerCase().includes(claimSearch.toLowerCase())) ||
        (c.claimant_name && c.claimant_name.toLowerCase().includes(claimSearch.toLowerCase())) ||
        (c.claimant_campus_id && c.claimant_campus_id.toLowerCase().includes(claimSearch.toLowerCase()));
      const matchStatus = claimStatusFilter === 'all' || c.status === claimStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [claims, claimSearch, claimStatusFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.admin_name.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.target_type.toLowerCase().includes(logSearch.toLowerCase());
      const matchAction = logActionFilter === 'all' || l.action_type === logActionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, logSearch, logActionFilter]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* 1. Dark Navy Sidebar Navigation */}
      <DashboardSidebar mode="admin" />

      {/* Main Content Stage */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden min-h-screen">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-200 rounded-md tracking-wider uppercase">
                Findlt Super Admin Center
              </span>
              <span className="text-xs text-slate-400">· {settings.college_name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {activeTab === 'dashboard' && 'Executive Operations Dashboard'}
              {activeTab === 'users' && 'Student & Personnel User Registry'}
              {activeTab === 'lost' && 'Campus Lost Belongings Directory'}
              {activeTab === 'found' && 'Turned-In Found Items & Locker Custody'}
              {activeTab === 'claims' && 'Student Ownership Claim Verification'}
              {activeTab === 'returned' && 'Verified Handover Audit & Return Records'}
              {activeTab === 'categories' && 'Item Categories & Classification'}
              {activeTab === 'notifications' && 'Campus Broadcast & Alert Dispatch'}
              {activeTab === 'logs' && 'Security & Administrative Audit Trail'}
              {activeTab === 'settings' && 'Campus Security & Custody Configuration'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setBroadcastModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: LIVE ADMIN DASHBOARD                         */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 9 Live Database Stats */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Campus System Telemetry (Supabase PostgreSQL)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Real-time DB Queries</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Registered Students */}
                <div
                  onClick={() => switchTab('/admin/users')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#635BFF]/40 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Students</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{stats.total_users}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Verified profiles</span>
                </div>

                {/* 2. Total Lost Items */}
                <div
                  onClick={() => switchTab('/admin/lost-items')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-slate-400 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Lost Items</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{stats.total_lost}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Reported missing</span>
                </div>

                {/* 3. Total Found Items */}
                <div
                  onClick={() => switchTab('/admin/found-items')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#635BFF]/40 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-[#635BFF] uppercase block">Found Items</span>
                  <p className="text-2xl font-extrabold text-[#635BFF] mt-1 tabular-nums">{stats.total_found}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">In campus custody</span>
                </div>

                {/* 4. Total Active Reports */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Active Reports</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{stats.active_reports}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Open investigation</span>
                </div>

                {/* 5. Total Pending Claims */}
                <div
                  onClick={() => switchTab('/admin/claims')}
                  className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-400 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-amber-700 uppercase block">Pending Claims</span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">{stats.pending_claims}</p>
                  <span className="text-[10px] text-amber-700/80 mt-0.5 block">Requires officer review</span>
                </div>

                {/* 6. Approved Claims */}
                <div
                  onClick={() => switchTab('/admin/claims')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase block">Approved Claims</span>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1 tabular-nums">{stats.approved_claims}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for student pickup</span>
                </div>

                {/* 7. Rejected Claims */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-rose-600 uppercase block">Rejected Claims</span>
                  <p className="text-2xl font-extrabold text-rose-600 mt-1 tabular-nums">{stats.rejected_claims}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Failed ownership proof</span>
                </div>

                {/* 8. Successfully Returned Items */}
                <div
                  onClick={() => switchTab('/admin/returned-items')}
                  className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Returned Items</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">{stats.returned_items}</p>
                  <span className="text-[10px] text-emerald-700/80 mt-0.5 block">Signed & audited</span>
                </div>

                {/* 9. Blocked/Suspended Users */}
                <div
                  onClick={() => switchTab('/admin/users')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-slate-400 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Blocked Users</span>
                  <p className="text-2xl font-extrabold text-slate-700 mt-1 tabular-nums">{stats.blocked_users}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Access suspended</span>
                </div>

                {/* 10. Audit Events */}
                <div
                  onClick={() => switchTab('/admin/logs')}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#635BFF]/40 cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Audit Records</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{logs.length}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Immutable logs</span>
                </div>
              </div>
            </div>

            {/* Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Chart 1: Monthly Lost vs Found Activity */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Monthly Item Reports & Resolutions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visual comparison between articles reported lost, found, and reunited with owners.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#635BFF]"></span> Found</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-slate-300"></span> Lost</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> Returned</span>
                  </div>
                </div>

                <div className="h-60 flex items-end justify-between gap-3 px-2 pt-4">
                  {monthlyReports.map((item, idx) => {
                    const maxHeight = 40;
                    const foundH = Math.min(100, (item.found / maxHeight) * 100);
                    const lostH = Math.min(100, (item.lost / maxHeight) * 100);
                    const returnedH = Math.min(100, (item.returned / maxHeight) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-48">
                          {/* Found */}
                          <div
                            style={{ height: `${foundH}%` }}
                            className="w-2 sm:w-3.5 bg-[#635BFF] rounded-t-sm group-hover:brightness-110 transition-all cursor-pointer"
                            title={`${item.month} - Found: ${item.found}`}
                          ></div>
                          {/* Lost */}
                          <div
                            style={{ height: `${lostH}%` }}
                            className="w-2 sm:w-3.5 bg-slate-300 rounded-t-sm group-hover:brightness-90 transition-all cursor-pointer"
                            title={`${item.month} - Lost: ${item.lost}`}
                          ></div>
                          {/* Returned */}
                          <div
                            style={{ height: `${returnedH}%` }}
                            className="w-2 sm:w-3.5 bg-emerald-500 rounded-t-sm group-hover:brightness-110 transition-all cursor-pointer"
                            title={`${item.month} - Returned: ${item.returned}`}
                          ></div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Claims Pipeline Status Distribution */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Claims Status Distribution</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live ownership verification pipeline</p>
                </div>

                <div className="space-y-4">
                  {claimDistribution.map((dist, idx) => {
                    const total = claims.length || 1;
                    const pct = Math.round((dist.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{dist.status}</span>
                          <span className="font-mono text-slate-500 tabular-nums">
                            {dist.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              dist.status === 'Approved'
                                ? 'bg-indigo-500'
                                : dist.status === 'Completed'
                                ? 'bg-emerald-500'
                                : dist.status === 'Rejected'
                                ? 'bg-rose-500'
                                : 'bg-amber-400'
                            }`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chart 3: User Registration Statistics by Department */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Student Registration by Department</h4>
                  <div className="space-y-2">
                    {userDeptDistribution.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate max-w-[170px]">{d.department}</span>
                        <span className="font-mono font-bold text-slate-800 tabular-nums">{d.count} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Claim Requests */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Recent Claim Requests</h3>
                  <button
                    onClick={() => switchTab('/admin/claims')}
                    className="text-xs font-semibold text-[#635BFF] hover:underline flex items-center gap-1"
                  >
                    View All ({claims.length})
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentClaimsList.slice(0, 4).map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {c.item_name || 'Item'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {c.claimant_name} · {c.claimant_campus_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            c.status === 'Approved'
                              ? 'bg-indigo-100 text-indigo-800'
                              : c.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                        <button
                          onClick={() => openReviewModal(c)}
                          className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                  {recentClaimsList.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No pending claims in queue.</p>
                  )}
                </div>
              </div>

              {/* Recent Activity Ticker (Immutable Audit Trail) */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Recent Security Activity</h3>
                  <button
                    onClick={() => switchTab('/admin/logs')}
                    className="text-xs font-semibold text-[#635BFF] hover:underline flex items-center gap-1"
                  >
                    Audit Log ({logs.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{act.admin_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">{act.details}</p>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No recent security events.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: USER MANAGEMENT                              */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Campus Registered Users</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search students by name, email, or campus ID. Inspect complete report histories and enforce security.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, ID, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-hidden"
                  />
                </div>

                <select
                  value={userDeptFilter}
                  onChange={(e) => setUserDeptFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                >
                  <option value="all">All Departments</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student Profile</th>
                      <th className="py-3 px-4">Campus ID</th>
                      <th className="py-3 px-4">Department & Course</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isCurrentUser = user?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{u.full_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.campus_id}</td>

                          <td className="py-3 px-4 text-slate-600">
                            <span className="font-medium block">{u.department}</span>
                            <span className="text-[11px] text-slate-400">
                              {u.course} · {u.semester}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                u.account_status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.account_status}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Deep dive profile modal */}
                              <button
                                onClick={() => handleViewUserDetails(u.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                View Profile
                              </button>

                              {/* Notify user */}
                              <button
                                onClick={() => {
                                  setDirectNotifyUser(u);
                                  setDirectNotifyData({
                                    title: '',
                                    message: '',
                                    notification_type: 'update'
                                  });
                                }}
                                className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                title="Send direct notification"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Activate toggle with self-protection */}
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={isCurrentUser}
                                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                  isCurrentUser
                                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                                    : u.account_status === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isCurrentUser ? 'Cannot suspend self' : 'Toggle access'}
                              >
                                {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                              </button>

                              {/* Role toggle with self-protection */}
                              <button
                                onClick={() => handleToggleRole(u)}
                                disabled={isCurrentUser}
                                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                  isCurrentUser
                                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title={isCurrentUser ? 'Cannot demote self' : 'Toggle admin'}
                              >
                                {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: LOST ITEMS MANAGEMENT                        */}
        {/* ======================================================== */}
        {activeTab === 'lost' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reported Lost Items</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student lost item reports, verify details, edit descriptions, or remove inappropriate posts.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search lost items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <select
                  value={itemCategoryFilter}
                  onChange={(e) => setItemCategoryFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.category_name}>
                      {c.category_name}
                    </option>
                  ))}
                </select>

                <select
                  value={itemStatusFilter}
                  onChange={(e) => setItemStatusFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="claimed">Claimed</option>
                  <option value="returned">Returned</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Lost Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location Lost</th>
                      <th className="py-3 px-4">Reporter Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Report Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLostItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{item.description}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                        <td className="py-3 px-4 text-slate-600">{item.location}</td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.reporter_name || 'Student'}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.reporter_campus_id} · {item.reporter_email}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              item.status === 'open'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.report_date}</td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/items/${item.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              title="View Public Page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              title="Edit item information"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id, item.item_name)}
                              className="p-1.5 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg"
                              title="Delete / Remove report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLostItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                          No lost reports found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 4: FOUND ITEMS MANAGEMENT                       */}
        {/* ======================================================== */}
        {activeTab === 'found' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Turned-In Found Items</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect uploaded item photos, track physical custody location, edit details, or remove misleading entries.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search found items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <select
                  value={itemCategoryFilter}
                  onChange={(e) => setItemCategoryFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.category_name}>
                      {c.category_name}
                    </option>
                  ))}
                </select>

                <select
                  value={itemStatusFilter}
                  onChange={(e) => setItemStatusFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="claimed">Claimed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>

            {/* Found Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item & Photo</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Found At</th>
                      <th className="py-3 px-4">Physical Custody Point</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Turn-In Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFoundItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <button
                                onClick={() =>
                                  setPreviewImage({
                                    url: item.image_url!,
                                    title: item.item_name,
                                    location: item.location
                                  })
                                }
                                className="relative group shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-200"
                                title="Click to enlarge image"
                              >
                                <img
                                  src={item.image_url}
                                  alt={item.item_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <FolderOpen className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block">{item.item_name}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">{item.description}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                        <td className="py-3 px-4 text-slate-600">{item.location}</td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {item.submitted_to || 'Central Lost & Found Office'}
                          </span>
                          <span className="text-[10px] text-slate-400">Locker secured</span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              item.status === 'open'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.report_date}</td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/items/${item.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              title="View Public Page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              title="Edit item details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id, item.item_name)}
                              className="p-1.5 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredFoundItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                          No found items found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 5: CLAIM VERIFICATION MANAGEMENT                */}
        {/* ======================================================== */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Claim Verification & Custody Decisions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify ownership proof, inspect evidence documents, approve pickup, or sign off on physical handover.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student or item..."
                    value={claimSearch}
                    onChange={(e) => setClaimSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <select
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                >
                  <option value="all">All Claim Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved (Awaiting Pickup)</option>
                  <option value="Completed">Completed / Handed Over</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Claimed Article</th>
                      <th className="py-3 px-4">Claimant Student</th>
                      <th className="py-3 px-4">Ownership Description & Evidence</th>
                      <th className="py-3 px-4">Decision</th>
                      <th className="py-3 px-4">Submission Date</th>
                      <th className="py-3 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {claim.item_name || 'Found Article'}
                          </span>
                          <span className="text-[11px] text-slate-400">{claim.item_category}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{claim.claimant_name}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {claim.claimant_campus_id} · {claim.claimant_email}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-600 text-[11px] leading-relaxed">
                            "{claim.ownership_description}"
                          </p>
                          {claim.evidence_url && (
                            <a
                              href={claim.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-semibold text-[#635BFF] hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Submitted Evidence Attachment
                            </a>
                          )}
                          {claim.admin_remarks && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-sm block mt-1 truncate">
                              Remarks: {claim.admin_remarks}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              claim.status === 'Approved'
                                ? 'bg-indigo-100 text-indigo-800'
                                : claim.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : claim.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {claim.status !== 'Completed' && (
                              <button
                                onClick={() => openReviewModal(claim)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Review & Decide
                              </button>
                            )}

                            {claim.status === 'Approved' && (
                              <button
                                onClick={() => openHandoverModal(claim)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                Verify Handover
                              </button>
                            )}

                            {claim.status === 'Completed' && (
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Returned & Audited
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClaims.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                          No claims found in this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 6: RETURNED ITEMS MANAGEMENT                    */}
        {/* ======================================================== */}
        {activeTab === 'returned' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Successfully Returned Belongings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete custody handover audit records. Every item listed here was physically verified and delivered to its rightful owner.
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search claimant or article..."
                  value={returnedSearch}
                  onChange={(e) => setReturnedSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>
            </div>

            {/* Returned Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Returned Article</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Claimant Student</th>
                      <th className="py-3 px-4">Custody Handover Officer</th>
                      <th className="py-3 px-4">Handover Date & Time</th>
                      <th className="py-3 px-4">Verification Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnedItems
                      .filter(
                        (r) =>
                          r.item_name.toLowerCase().includes(returnedSearch.toLowerCase()) ||
                          r.claimant_name.toLowerCase().includes(returnedSearch.toLowerCase()) ||
                          r.claimant_campus_id.toLowerCase().includes(returnedSearch.toLowerCase())
                      )
                      .map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{rec.item_name}</span>
                            <span className="text-[11px] text-slate-400">Found at: {rec.location}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-medium">{rec.category}</td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{rec.claimant_name}</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {rec.claimant_campus_id} · {rec.claimant_email}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block">{rec.verified_by}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm inline-block">
                              ID Card Verified
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(rec.handover_date).toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                            <p className="line-clamp-2">{rec.notes || 'Handover verified and signed.'}</p>
                          </td>
                        </tr>
                      ))}
                    {returnedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                          No items have been marked returned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 7: CATEGORY MANAGEMENT                          */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Campus Item Categories</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize item classifications, inspect active listings per category, and add custom campus taxonomy.
                </p>
              </div>

              <button
                onClick={handleOpenAddCategory}
                className="px-4 py-2 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-slate-900">{c.category_name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          c.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{c.description || 'No description provided.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600 font-bold">
                      {c.item_count !== undefined ? `${c.item_count} items` : 'Live'}
                    </span>
                    <button
                      onClick={() => handleOpenEditCategory(c)}
                      className="text-xs font-semibold text-[#635BFF] hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Category</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 8: NOTIFICATION MANAGEMENT                      */}
        {/* ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Campus Dispatch & Broadcast Center</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send high-priority notifications to all campus students or targeted direct alerts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBroadcastModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast to All</span>
                </button>
              </div>
            </div>

            {/* Notification History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Dispatched Notifications</h3>
              <div className="divide-y divide-slate-100">
                {notificationsList.map((n) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-sm bg-slate-100 text-slate-600 uppercase">
                          {n.notification_type || 'Update'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {notificationsList.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">No notifications recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 9: ADMIN ACTIVITY LOGS                          */}
        {/* ======================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Immutable Administrative Audit Logs</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cryptographically track all sensitive actions: user blocking, report deletion, claim decisions, physical handovers, and protocol changes.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                >
                  <option value="all">All Actions</option>
                  <option value="USER_STATUS_CHANGE">User Status Change</option>
                  <option value="USER_ROLE_CHANGE">User Role Change</option>
                  <option value="ITEM_DELETE">Item Deletion</option>
                  <option value="ITEM_STATUS_CHANGE">Item Status Change</option>
                  <option value="CLAIM_REVIEW">Claim Review</option>
                  <option value="ITEM_HANDOVER">Item Handover</option>
                  <option value="SETTINGS_UPDATE">Settings Update</option>
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Admin Officer</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Action Description & Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">{log.admin_name}</td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.action_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {log.target_type} ({log.target_id.slice(0, 10)}...)
                        </td>

                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                          {(log.previous_state || log.new_state) && (
                            <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>From: {log.previous_state || 'N/A'}</span>
                              <span>→</span>
                              <span className="font-bold text-slate-700">To: {log.new_state}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                          No audit records found matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 10: SYSTEM SETTINGS                             */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">System & Custody Protocols</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure campus lost and found parameters, official contact information, and chain-of-custody retention rules.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Brand Name</label>
                  <input
                    type="text"
                    required
                    value={settings.system_name}
                    onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name</label>
                  <input
                    type="text"
                    required
                    value={settings.college_name}
                    onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campus Security Hotline</label>
                  <input
                    type="text"
                    required
                    value={settings.security_hotline}
                    onChange={(e) => setSettings({ ...settings, security_hotline: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Email</label>
                  <input
                    type="email"
                    required
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Central Custody Office Location</label>
                  <input
                    type="text"
                    required
                    value={settings.central_office}
                    onChange={(e) => setSettings({ ...settings, central_office: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Public Operating Hours</label>
                  <input
                    type="text"
                    required
                    value={settings.operating_hours}
                    onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Retention Days</label>
                  <input
                    type="number"
                    min={15}
                    max={365}
                    required
                    value={settings.item_retention_days}
                    onChange={(e) => setSettings({ ...settings, item_retention_days: parseInt(e.target.value) || 90 })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Days before unclaimed articles are transferred to campus donation.
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={settings.auto_approve_claims}
                      onChange={(e) => setSettings({ ...settings, auto_approve_claims: e.target.checked })}
                      className="w-4 h-4 rounded-sm text-[#635BFF] focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-800">Auto-Approve Low-Risk Claims</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block pl-6">
                    Requires admin signature only on final physical handover.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* USER PROFILE DEEP-DIVE MODAL */}
      <Modal
        isOpen={!!selectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        title={`Student Profile: ${selectedUserDetails?.user.full_name}`}
        maxWidth="lg"
      >
        {selectedUserDetails && (
          <div className="space-y-6 text-xs">
            {/* User Meta Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Campus ID</span>
                <p className="font-mono font-bold text-slate-900">{selectedUserDetails.user.campus_id}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Email</span>
                <p className="font-mono text-slate-700 truncate">{selectedUserDetails.user.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Department</span>
                <p className="font-semibold text-slate-800">{selectedUserDetails.user.department}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Course & Sem</span>
                <p className="text-slate-700">
                  {selectedUserDetails.user.course} · {selectedUserDetails.user.semester}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Role</span>
                <p className="font-bold text-slate-800 uppercase">{selectedUserDetails.user.role}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Account Status</span>
                <span
                  className={`px-1.5 py-0.2 rounded-sm font-bold text-[10px] ${
                    selectedUserDetails.user.account_status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedUserDetails.user.account_status}
                </span>
              </div>
            </div>

            {/* Activity History Tabs */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Lost Item Reports ({selectedUserDetails.lost_items.length})
                </h4>
                {selectedUserDetails.lost_items.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedUserDetails.lost_items.map((i) => (
                      <div key={i.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{i.item_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {i.category} · {i.location} · {i.report_date}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No lost reports filed.</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Found Item Turn-Ins ({selectedUserDetails.found_items.length})
                </h4>
                {selectedUserDetails.found_items.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedUserDetails.found_items.map((i) => (
                      <div key={i.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{i.item_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {i.category} · {i.location} · {i.report_date}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No found items reported.</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Ownership Claims Filed ({selectedUserDetails.claims.length})
                </h4>
                {selectedUserDetails.claims.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedUserDetails.claims.map((c) => (
                      <div key={c.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{c.item_name || 'Item'}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{c.ownership_description}"</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            c.status === 'Approved'
                              ? 'bg-indigo-100 text-indigo-800'
                              : c.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No claims filed.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal
        isOpen={!!selectedItemForEdit}
        onClose={() => setSelectedItemForEdit(null)}
        title={`Edit ${selectedItemForEdit?.item_type === 'lost' ? 'Lost Report' : 'Found Article'}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveItemEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              required
              value={editFormData.item_name}
              onChange={(e) => setEditFormData({ ...editFormData, item_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Category</label>
            <select
              value={editFormData.category}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              required
              value={editFormData.location}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Report Status</label>
            <select
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            >
              <option value="open">Open / Active</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned to Owner</option>
              <option value="expired">Expired / Archived</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedItemForEdit(null)}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* IMAGE PREVIEW MODAL */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.title || 'Found Item Image'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="w-full h-80 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200">
            {previewImage?.url && (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Location: <strong>{previewImage?.location}</strong></span>
            <button
              onClick={() => setPreviewImage(null)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>

      {/* REVIEW CLAIM MODAL */}
      <Modal
        isOpen={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
        title={`Review Claim: ${selectedClaim?.item_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-900">Claimant: {selectedClaim?.claimant_name}</p>
            <p className="text-slate-500 font-mono text-[11px]">
              ID: {selectedClaim?.claimant_campus_id} · {selectedClaim?.claimant_email}
            </p>
            <p className="text-slate-700 pt-2 border-t border-slate-200 mt-2 font-medium">Submitted Ownership Proof:</p>
            <p className="text-slate-600 italic leading-relaxed text-[11px]">"{selectedClaim?.ownership_description}"</p>
            {selectedClaim?.evidence_url && (
              <a
                href={selectedClaim.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-semibold text-[#635BFF] hover:underline flex items-center gap-1 pt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Inspect Attached Proof File
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Decision</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
            >
              <option value="Approved">Approved (Claim verified · Ready for Pickup)</option>
              <option value="Under Review">Under Review (Need additional clarification)</option>
              <option value="Rejected">Rejected (Proof insufficient or incorrect)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Remarks & Instructions</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please bring your physical student ID card to Gate 2 Security Booth."
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedClaim(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl disabled:opacity-50"
            >
              {submittingReview ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VERIFY PHYSICAL HANDOVER MODAL */}
      <Modal
        isOpen={!!handoverClaim}
        onClose={() => setHandoverClaim(null)}
        title="Execute Physical Item Handover"
        maxWidth="md"
      >
        <form onSubmit={handleVerifyHandover} className="space-y-4">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Final Release Authorization</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              You are certifying that {handoverClaim?.claimant_name} ({handoverClaim?.claimant_campus_id}) is present in
              person with valid credentials to collect "{handoverClaim?.item_name}".
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Handover Verification Remarks</label>
            <textarea
              rows={3}
              required
              value={handoverRemarks}
              onChange={(e) => setHandoverRemarks(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setHandoverClaim(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingHandover}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {submittingHandover ? 'Documenting Handover...' : 'Sign & Complete Handover'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CATEGORY CREATE/EDIT MODAL */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Equipment"
              value={catFormData.category_name}
              onChange={(e) => setCatFormData({ ...catFormData, category_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="e.g. Microscopes, test tubes, apparatus"
              value={catFormData.description}
              onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          {editingCategory && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={catFormData.is_active}
                onChange={(e) => setCatFormData({ ...catFormData, is_active: e.target.checked })}
                className="w-4 h-4 rounded-sm text-[#635BFF]"
              />
              <span className="font-bold text-slate-800">Category Active</span>
            </label>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* BROADCAST MODAL */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Broadcast Announcement to All Students"
        maxWidth="md"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Lost Belongings Clearance before Semester Break"
              value={broadcastData.title}
              onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notification Priority Type</label>
            <select
              value={broadcastData.notification_type}
              onChange={(e) => setBroadcastData({ ...broadcastData, notification_type: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            >
              <option value="announcement">General Campus Announcement</option>
              <option value="security">Security Alert / High Priority</option>
              <option value="update">System Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Message</label>
            <textarea
              rows={4}
              required
              placeholder="Please check the campus lost and found lockers before Friday 5:00 PM..."
              value={broadcastData.message}
              onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBroadcastModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast Alert</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DIRECT STUDENT NOTIFICATION MODAL */}
      <Modal
        isOpen={!!directNotifyUser}
        onClose={() => setDirectNotifyUser(null)}
        title={`Notify Student: ${directNotifyUser?.full_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSendDirectNotification} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">{directNotifyUser?.full_name}</p>
            <p className="text-[11px] font-mono text-slate-500">
              Campus ID: {directNotifyUser?.campus_id} · {directNotifyUser?.email}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alert Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Found Item Matched Your Description"
              value={directNotifyData.title}
              onChange={(e) => setDirectNotifyData({ ...directNotifyData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Message</label>
            <textarea
              rows={3}
              required
              placeholder="An item matching your lost report has been handed in to the Security Desk..."
              value={directNotifyData.message}
              onChange={(e) => setDirectNotifyData({ ...directNotifyData, message: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDirectNotifyUser(null)}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deliver Alert</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
