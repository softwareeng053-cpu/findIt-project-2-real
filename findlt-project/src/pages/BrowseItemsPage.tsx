import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { api, Item } from '../services/api';

export const BrowseItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state initialized from query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'found'); // default found
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const categories = [
    'All',
    'Electronics',
    'Documents',
    'Accessories',
    'Bags',
    'Books & Stationery',
    'Clothing',
    'Keys',
    'Other'
  ];

  const locations = [
    'All Locations',
    'Library',
    'Cafeteria',
    'Engineering Block',
    'Humanities Hall',
    'Sports Complex',
    'Auditorium',
    'Science Lab',
    'Dormitory'
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        type: type === 'all' ? undefined : type,
        category: category === 'All' || category === 'all' ? undefined : category,
        status: status === 'all' ? undefined : status,
        location: location === 'All Locations' || location === 'all' ? undefined : location,
        search: search.trim() || undefined,
        sort,
        page,
        limit: 12
      };
      const res = await api.getItems(params);
      setItems(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, [type, category, status, location, search, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('all');
    setCategory('All');
    setStatus('all');
    setLocation('All Locations');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Campus Repository
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Browse Lost & Found Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search through reported missing articles and items turned in to campus security.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/report-lost"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              Report Lost Item
            </Link>
            <Link
              to="/report-found"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-sm shadow-[#635BFF]/30"
            >
              Report Found Item
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by keywords, brand, color, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#635BFF]"
              />
            </div>
            
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Search Directory
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </form>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Type selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Report Type</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-[#635BFF]"
              >
                <option value="all">All Types</option>
                <option value="found">Found Items (Turned In)</option>
                <option value="lost">Lost Items (Missing)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-[#635BFF]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Campus Location</label>
              <select
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-[#635BFF]"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-[#635BFF]"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open / Unclaimed</option>
                <option value="claimed">Claim in Review</option>
                <option value="returned">Successfully Returned</option>
              </select>
            </div>

            {/* Sort */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Order</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-[#635BFF]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
          <span className="font-medium">
            Showing <strong className="text-slate-900 tabular-nums">{items.length}</strong> of{' '}
            <strong className="text-slate-900 tabular-nums">{totalCount}</strong> articles
          </span>
          <span className="font-mono text-[11px]">Page {page} of {totalPages}</span>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="h-44 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-lg mx-auto">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No items match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Try adjusting your search terms or reset filters to see all campus reports.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-4 py-2 text-xs font-semibold text-[#635BFF] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 bg-slate-50">
                      <Search className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.item_type === 'lost' ? 'Lost Report (No Image)' : 'No Photo Available'}
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md shadow-xs ${
                      item.item_type === 'found' ? 'bg-[#635BFF] text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {item.item_type}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xs ${
                      item.status === 'open'
                        ? 'bg-emerald-500 text-white'
                        : item.status === 'claimed'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {item.status === 'open'
                        ? item.item_type === 'found' ? 'Awaiting Owner' : 'Still Missing'
                        : item.status === 'claimed' ? 'Claim Pending' : 'Returned'}
                    </span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-[10px] font-medium text-white">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors line-clamp-1">
                      {item.item_name}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.item_type === 'found' ? 'Found' : 'Lost'} on {item.report_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/items/${item.id}`}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold text-center text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Link>
                    
                    {item.item_type === 'found' && item.status !== 'returned' && (
                      <Link
                        to={`/items/${item.id}?action=claim`}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-center text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-lg transition-colors shadow-xs"
                      >
                        Claim Item
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                  page === num
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
