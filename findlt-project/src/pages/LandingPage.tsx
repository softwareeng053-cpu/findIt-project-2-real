import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Building,
  ChevronRight,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { api, Item, PublicStats } from '../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats>({
    total_items: 148,
    successfully_returned: 129,
    active_reports: 19,
    total_found: 4,
    total_lost: 2
  });
  const [recentFoundItems, setRecentFoundItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, itemsData] = await Promise.all([
          api.getPublicStats(),
          api.getItems({ type: 'found', limit: 4, sort: 'newest' })
        ]);
        setStats(statsData);
        setRecentFoundItems(itemsData.items || []);
      } catch (err) {
        console.error('Error fetching landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-[#635BFF]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Campus Lost & Found System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
                Lost Something? <br />
                <span className="text-[#635BFF]">Let's Find It.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                The university's centralized network for reporting misplaced belongings, cataloging found articles, and safely verifying ownership with the Campus Security Desk.
              </p>

              {/* Direct Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
                <div className="flex items-center bg-white rounded-2xl shadow-lg shadow-indigo-950/5 border border-slate-200 p-2 focus-within:border-[#635BFF] transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by item name (e.g. MacBook, dorm key, Casio, calculator, jacket)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors whitespace-nowrap shadow-sm shadow-[#635BFF]/30"
                  >
                    Find Now
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/report-lost"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm shadow-slate-900/20"
                >
                  Report Lost Item
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/report-found"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#635BFF] bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all shadow-xs"
                >
                  Report Found Item
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Browse all catalog
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Student ID Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <span>Zero Public Contact Exposure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-500" />
                  <span>Security Locker Custody</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 group">
                <img
                  src="/src/assets/images/hero_campus_lostfound_1793681206224.jpg"
                  alt="Students on university campus collaborating in modern library commons"
                  className="w-full h-80 sm:h-96 lg:h-[420px] object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                    Campus Safety & Student Affairs
                  </span>
                  <p className="text-sm font-semibold mt-1">
                    Central Security Desk · Gate 2 & Main Library Locker System
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Over 85% of items logged with Findlt are returned to rightful owners within 48 hours.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS STRIP */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            <div className="flex items-center gap-4 py-2 sm:py-0 sm:px-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#635BFF] shrink-0">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.total_items}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                  Total Items Logged
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2 sm:py-0 sm:px-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.successfully_returned}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                  Successfully Returned
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2 sm:py-0 sm:px-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.active_reports}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                  Active Campus Reports
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. RECENTLY FOUND ARTICLES GALLERY */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider mb-1">
                Recent Discoveries
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Recently Found Items on Campus
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Articles turned in to security desks waiting for rightful owners to claim.
              </p>
            </div>
            <Link
              to="/browse?type=found"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#635BFF] hover:text-[#5046E5] hover:underline"
            >
              View all found items
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                  <div className="h-44 bg-slate-200 rounded-xl w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentFoundItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No active found items right now</p>
              <p className="text-xs text-slate-400 mt-1">All recently turned in articles have been claimed!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentFoundItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Image container */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                        <Search className="w-8 h-8 text-slate-300 mb-1" />
                        <span className="text-[11px] font-medium text-slate-400">Photograph Pending</span>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xs ${
                        item.status === 'open'
                          ? 'bg-emerald-500 text-white'
                          : item.status === 'claimed'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-white'
                      }`}>
                        {item.status === 'open' ? 'Awaiting Owner' : item.status === 'claimed' ? 'Claim in Review' : 'Returned'}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-[10px] font-medium text-white">
                      {item.category}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors line-clamp-1">
                        {item.item_name}
                      </h3>
                      
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Found on {item.report_date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/items/${item.id}`}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-center text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                      <Link
                        to={`/items/${item.id}?action=claim`}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-center text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-lg transition-colors shadow-xs"
                      >
                        Claim Item
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Chain of Custody
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How Findlt Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A 3-step transparent protocol designed to safeguard campus property and eliminate false claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-[#635BFF] font-bold text-lg flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900">1. Report or Discover</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Lost a bag, keys, or student card? Log a report with distinct characteristics. Found an item? Upload a photo and drop it off at any security desk.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-[#635BFF]">
                Instant campus directory index
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900">2. Verify Ownership</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  The rightful owner files a claim detailing unique markers (lock codes, hidden scratches, sticker placements). Campus administrators review and validate proof.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-emerald-700">
                Administrative security validation
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-bold text-lg flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900">3. Physical Handover</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Once approved, visit the security desk with your student ID card. Officer signs off the physical handover audit trail and marks item resolved.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-amber-800">
                Signed custodial audit log
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. WHY CHOOSE FINDLT SECTION */}
      <section id="about" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
                Built For Campus Community
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Why Campus Relies on Findlt
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traditional university lost and found relies on cluttered corkboards and scattered WhatsApp groups where personal phone numbers are exposed. Findlt modernizes student support with institutional rigor.
              </p>

              <div className="space-y-3 pt-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#635BFF] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Student Privacy Shield</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Finders never have their phone numbers or email addresses displayed publicly on the internet.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Zero Imposter Claims</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Physical items remain in campus security lockers until credentials match administrative approval.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Comprehensive In-App Notifications</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Students are notified as soon as an item matching their report is turned in or approved.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Campus Security Desks</h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    24/7 Active Support
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Central Security Office</p>
                      <p className="text-slate-500 mt-0.5">Main Gate 2 Security Booth · Primary Locker Safe</p>
                    </div>
                    <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Ext. 8801
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Library Circulation Desk</p>
                      <p className="text-slate-500 mt-0.5">Science Library Level 1 · Study items & Books</p>
                    </div>
                    <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Ext. 4120
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Student Affairs Administration</p>
                      <p className="text-slate-500 mt-0.5">Administrative Block Room 102 · Official Claims</p>
                    </div>
                    <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Ext. 1022
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/report-found"
                    className="w-full block text-center py-3 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-sm"
                  >
                    Found something right now? Log it in 60 seconds
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
