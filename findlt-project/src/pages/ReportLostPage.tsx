import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ReportLostPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [lastSeenDate, setLastSeenDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [contactPreference, setContactPreference] = useState('Campus Email');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Electronics',
    'Documents',
    'Accessories',
    'Bags',
    'Books & Stationery',
    'Clothing',
    'Keys',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Login Required', 'Please log in to register an official lost item report.');
      navigate('/login?redirect=/report-lost');
      return;
    }

    if (!itemName.trim() || !category || !description.trim() || !lastSeenLocation.trim()) {
      toast.error('Validation Error', 'Please complete all required fields (*)');
      return;
    }

    setSubmitting(true);
    try {
      await api.reportLost({
        item_name: itemName.trim(),
        category,
        description: description.trim(),
        brand: brand.trim(),
        color: color.trim(),
        last_seen_date: lastSeenDate,
        last_seen_location: lastSeenLocation.trim(),
        additional_details: additionalDetails.trim(),
        contact_preference: contactPreference
      });

      toast.success('Lost Item Reported', 'Your missing item report is now active in the campus lost registry.');
      navigate('/student/reports');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit report.';
      toast.error('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10">
          
          <div className="border-b border-slate-100 pb-6 mb-6">
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Student Incident Report
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Report a Lost Item
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide thorough details. Campus security and students searching for turned-in items match these attributes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Item Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Silver Dell XPS 13, Navy Gym Bag, Dorm Key Fob..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Last Seen Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={lastSeenDate}
                  onChange={(e) => setLastSeenDate(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden tabular-nums"
                />
              </div>
            </div>

            {/* Brand & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Brand / Manufacturer <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Nike, Casio, Samsonite"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Primary Color / Finish
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black, Navy Blue, Brushed Gold"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Last Seen Location */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Last Seen Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science Library 2nd Floor Cubicle 14, Cafeteria patio, Sports Complex gym..."
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Description & Distinguishing Features <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe stickers, scratches, case color, unique keychains, or contents inside..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Additional details & Contact Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Contact Preference
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                >
                  <option value="Campus Email">College Email & In-App Portal</option>
                  <option value="Phone Call">Phone / SMS Only</option>
                  <option value="Security Desk Relay">Security Desk Relay (Strict Privacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reward offered, high urgency for exams"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/"
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-md shadow-[#635BFF]/30 disabled:opacity-50"
              >
                {submitting ? 'Submitting Report...' : 'Publish Lost Item Report'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
