import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  Edit,
  Trash2,
  Eye,
  PlusCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api, Item } from '../services/api';
import { useToast } from '../context/ToastContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Modal } from '../components/Modal';

export const MyReportsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [lostItems, setLostItems] = useState<Item[]>([]);
  const [foundItems, setFoundItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getMyReports();
      setLostItems(res.lost || []);
      setFoundItems(res.found || []);
    } catch (err) {
      console.error(err);
      toast.error('Load Error', 'Failed to fetch your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openEditModal = (item: Item) => {
    setEditItem(item);
    setEditName(item.item_name);
    setEditDescription(item.description);
    setEditLocation(item.location);
    setEditStatus(item.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSavingEdit(true);
    try {
      await api.updateItem(editItem.id, {
        item_name: editName,
        description: editDescription,
        location: editLocation,
        status: editStatus
      });
      toast.success('Report Updated', 'Your report was successfully modified.');
      setEditItem(null);
      fetchReports();
    } catch (err: any) {
      toast.error('Update Failed', err.response?.data?.error || 'Could not update report');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteItem(deleteId);
      toast.success('Report Deleted', 'The report has been removed.');
      setDeleteId(null);
      fetchReports();
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.error || 'Could not delete report');
    }
  };

  const currentItems = activeTab === 'lost' ? lostItems : foundItems;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <DashboardSidebar mode="student" />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Record Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              My Campus Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your lost reports and track found items you have turned in to security.
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-sm"
            >
              Turn In Item
            </Link>
          </div>
        </div>

        {/* Segmented Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-6 border border-slate-200">
          <button
            onClick={() => setActiveTab('lost')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'lost'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Lost Items Reported</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded-full tabular-nums">
              {lostItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('found')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'found'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-emerald-600" />
            <span>Found Items Turned In</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded-full tabular-nums">
              {foundItems.length}
            </span>
          </button>
        </div>

        {/* Reports Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-lg mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No {activeTab} reports on record</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'lost'
                ? 'Misplaced an item? Create a report to alert campus security and community.'
                : 'Turned in an article to a security desk? Log it here for record keeping.'}
            </p>
            <Link
              to={activeTab === 'lost' ? '/report-lost' : '/report-found'}
              className="inline-block mt-4 px-4 py-2 text-xs font-bold text-white bg-[#635BFF] rounded-xl hover:bg-[#5046E5] transition-colors"
            >
              {activeTab === 'lost' ? 'Report Lost Belonging' : 'Turn In Found Item'}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">{item.item_name}</span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] font-medium text-slate-500">{item.category}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        item.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'claimed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{item.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.location}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.report_date}
                      </span>
                      {item.submitted_to && (
                        <>
                          <span>·</span>
                          <span className="text-indigo-600 font-semibold">{item.submitted_to}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      to={`/items/${item.id}`}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="View public details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Edit report"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit Report: ${editItem?.item_name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              required
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
            >
              <option value="open">Open / Active</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned / Resolved</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Report Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to remove this report from the campus directory? This action cannot be reversed.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Keep Report
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
