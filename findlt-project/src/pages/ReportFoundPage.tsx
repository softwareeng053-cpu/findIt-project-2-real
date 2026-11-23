import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Building,
  Image as ImageIcon,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ReportFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [foundDate, setFoundDate] = useState(new Date().toISOString().split('T')[0]);
  const [foundLocation, setFoundLocation] = useState('');
  const [submittedTo, setSubmittedTo] = useState('Central Campus Security Desk (Gate 2)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('/src/assets/images/found_item_macbook_1793681206791.jpg');
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

  const dropOffLocations = [
    'Central Campus Security Desk (Gate 2)',
    'Main Science Library Circulation Desk',
    'Campus Administration Office Room 102',
    'Student Union Helpdesk',
    'Hostel / Dormitory Security Guard Post',
    'Sports Complex Reception Counter'
  ];

  const presetPhotos = [
    { label: 'Laptop / Tech', url: '/src/assets/images/found_item_macbook_1793681206791.jpg' },
    { label: 'Headphones', url: '/src/assets/images/found_item_headphones_1793681207346.jpg' },
    { label: 'Backpack', url: '/src/assets/images/found_item_backpack_1793681207588.jpg' },
    { label: 'Keys & ID', url: '/src/assets/images/found_item_id_keys_1793681208297.jpg' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('File Too Large', 'Please select an image file under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        toast.info('Image Attached', 'Photograph preview is ready for submission.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Login Required', 'Please log in to submit an official found item report.');
      navigate('/login?redirect=/report-found');
      return;
    }

    if (!itemName.trim() || !category || !description.trim() || !foundLocation.trim()) {
      toast.error('Validation Error', 'Please complete all required fields (*)');
      return;
    }

    setSubmitting(true);
    try {
      await api.reportFound({
        item_name: itemName.trim(),
        category,
        description: description.trim(),
        brand: brand.trim(),
        color: color.trim(),
        image_url: imagePreview,
        found_date: foundDate,
        found_location: foundLocation.trim(),
        submitted_to: submittedTo,
        additional_notes: additionalNotes.trim()
      });

      toast.success('Found Item Logged', 'Thank you! The item is now listed in the campus repository.');
      navigate('/browse');
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
              Good Samaritan Submission
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Turn In / Report a Found Item
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Every found item is safely stored in a campus security locker while verified owners are notified.
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
                placeholder="e.g. Sony WH-1000XM4 Headphones, Blue Hydroflask, Texas Instruments Calculator..."
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
                  Date Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden tabular-nums"
                />
              </div>
            </div>

            {/* Image Upload & Preview Section */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Item Photograph <span className="text-slate-400 font-normal">(Preview & Upload)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {/* Preview Box */}
                <div className="w-full sm:w-44 h-36 rounded-xl bg-slate-200 overflow-hidden relative shrink-0 border border-slate-300">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Found item preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setImagePreview('')}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full text-xs"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[10px]">No image attached</span>
                    </div>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 space-y-2.5">
                  <p className="text-xs text-slate-600">
                    Upload an authentic photograph or choose a representative sample.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Choose Local File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Campus Items Shortcuts */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Or pick sample catalog photo:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {presetPhotos.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImagePreview(preset.url)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-[#635BFF] border border-slate-200 rounded-lg transition-colors text-slate-600"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Found Location & Submitted To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Location Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Library Room 204, Cafeteria courtyard..."
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Submitted To / Custody Point <span className="text-rose-500">*</span>
                </label>
                <select
                  value={submittedTo}
                  onChange={(e) => setSubmittedTo(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                >
                  {dropOffLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Briefly state condition, brand, and where it was handed over..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Custody Notes / Security Locker Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Deposited in Locker #14 by Guard Peterson"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
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
                {submitting ? 'Registering Found Item...' : 'Register Found Item'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
