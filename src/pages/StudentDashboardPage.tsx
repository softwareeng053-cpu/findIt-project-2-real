import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Eye,
  AlertCircle
} from 'lucide-react';
import { api, Item, Claim } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    lostReports: 0,
    foundReports: 0,
    pendingClaims: 0,
    returnedItems: 0
  });
  const [myRecentReports, setMyRecentReports] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [reportsRes, claimsRes] = await Promise.all([
          api.getMyReports(),
          api.getMyClaims()
        ]);

        const allReports = [...(reportsRes.lost || []), ...(reportsRes.found || [])];
        const returned = allReports.filter((r) => r.status === 'returned').length;
        const pending = (claimsRes.claims || []).filter(
          (c: Claim) => c.status === 'Pending' || c.status === 'Under Review'
        ).length;

        setStats({
          lostReports: reportsRes.total_lost || 0,
          foundReports: reportsRes.total_found || 0,
          pendingClaims: pending,
          returnedItems: returned
        });

        setMyRecentReports(allReports.slice(0, 4));
        setMyClaims(claimsRes.claims || []);
      } catch (err) {
        console.error('Error loading student dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <DashboardSidebar mode="student" />

      {/* Main Workspace */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Student Activity Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Welcome back, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Campus ID: <strong className="font-mono text-slate-700">{user?.campus_id}</strong> · {user?.department}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/report-lost"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              Report Lost Item
            </Link>
            <Link
              to="/report-found"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-sm shadow-[#635BFF]/30"
            >
              Turn In Item
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase text-slate-500">My Lost Reports</span>
              <FileText className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.lostReports}
            </p>
            <p className="text-[11px] text-slate-500">Missing articles logged</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase text-slate-500">Found Items Logged</span>
              <PlusCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.foundReports}
            </p>
            <p className="text-[11px] text-slate-500">Turned in to security</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase text-slate-500">Pending Claims</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.pendingClaims}
            </p>
            <p className="text-[11px] text-slate-500">Awaiting admin review</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase text-slate-500">Recovered & Returned</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.returnedItems}
            </p>
            <p className="text-[11px] text-slate-500">Successfully resolved</p>
          </div>

        </div>

        {/* Quick Action Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link
            to="/report-lost"
            className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-100/70 transition-colors flex flex-col items-center justify-center text-center group"
          >
            <PlusCircle className="w-6 h-6 text-[#635BFF] mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900">Report Lost Item</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Missing article</span>
          </Link>

          <Link
            to="/report-found"
            className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/70 transition-colors flex flex-col items-center justify-center text-center group"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900">Report Found Item</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Turn in to desk</span>
          </Link>

          <Link
            to="/browse"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-center group"
          >
            <Search className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900">Browse Items</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Campus directory</span>
          </Link>

          <Link
            to="/student/claims"
            className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/70 transition-colors flex flex-col items-center justify-center text-center group"
          >
            <Clock className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900">My Claims</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Track verification</span>
          </Link>
        </div>

        {/* Content Split: My Recent Reports vs My Active Claims */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Reports */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Recent Submissions</h3>
              <Link to="/student/reports" className="text-xs font-semibold text-[#635BFF] hover:underline">
                View all reports
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : myRecentReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>You haven't logged any lost or found reports yet.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Link to="/report-lost" className="text-[#635BFF] font-semibold hover:underline">
                    Report a lost item
                  </Link>
                  <span>·</span>
                  <Link to="/report-found" className="text-[#635BFF] font-semibold hover:underline">
                    Turn in an item
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {myRecentReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          report.item_type === 'found' ? 'bg-[#635BFF] text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {report.item_type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{report.item_name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {report.location} · {report.report_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${
                        report.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.status === 'claimed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {report.status}
                      </span>
                      <Link
                        to={`/items/${report.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Claims & Handover Status */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Active Claims Tracker</h3>
              <Link to="/student/claims" className="text-xs font-semibold text-[#635BFF] hover:underline">
                View all claims
              </Link>
            </div>

            {myClaims.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No claims in progress.</p>
                <Link to="/browse?type=found" className="text-[#635BFF] font-semibold hover:underline block mt-2">
                  Browse found items to claim
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myClaims.slice(0, 3).map((claim) => (
                  <div key={claim.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {claim.item_name || 'Item'}
                      </h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        claim.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'Completed'
                          ? 'bg-indigo-100 text-indigo-800'
                          : claim.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {claim.ownership_description}
                    </p>

                    {claim.admin_remarks && (
                      <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-700">Admin Remarks: </span>
                        {claim.admin_remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
