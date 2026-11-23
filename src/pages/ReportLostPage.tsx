
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';

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

  const [lastSeenDate, setLastSeenDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [contactPreference, setContactPreference] = useState('Campus Email');

  // Image states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

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

  // Create and clean image preview URL
  useEffect(() => {
    if (!selectedFile) {
      setImagePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  // Image selection
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        'Invalid Image',
        'Only JPG, PNG and WEBP images are allowed.'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        'Image Too Large',
        'Please select an image smaller than 5 MB.'
      );
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedFile(null);
  };

  // Submit Lost Item Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info(
        'Login Required',
        'Please log in to register an official lost item report.'
      );

      navigate('/login?redirect=/report-lost');
      return;
    }

    if (
      !itemName.trim() ||
      !category ||
      !description.trim() ||
      !lastSeenLocation.trim()
    ) {
      toast.error(
        'Validation Error',
        'Please complete all required fields (*).'
      );
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = '';

      // Step 1: Upload selected image to Supabase Storage
      if (selectedFile) {
        const uploaded = await api.uploadImage(selectedFile);

        if (!uploaded?.url) {
          throw new Error('Image upload failed. Please try again.');
        }

        imageUrl = uploaded.url;
      }

      // Step 2: Save report with returned public image URL
      await api.reportLost({
        item_name: itemName.trim(),
        category,
        description: description.trim(),
        brand: brand.trim(),
        color: color.trim(),
        image_url: imageUrl,
        last_seen_date: lastSeenDate,
        last_seen_location: lastSeenLocation.trim(),
        additional_details: additionalDetails.trim(),
        contact_preference: contactPreference
      });

      toast.success(
        'Lost Item Reported',
        'Your missing item report is now active in the campus lost registry.'
      );

      navigate('/student/reports');

    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to submit report.';

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

        {/* Form Card */}
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
                maxLength={200}
                placeholder="e.g. Silver Dell XPS 13, Navy Gym Bag..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Category and Date */}
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
                    <option key={c} value={c}>
                      {c}
                    </option>
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

            {/* Brand and Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Brand / Manufacturer (Optional)
                </label>

                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Apple, Nike, Casio"
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
                  maxLength={60}
                  placeholder="e.g. Matte Black, Navy Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Item Photograph (Optional)
              </label>

              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full min-h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-[#635BFF] cursor-pointer transition-colors">

                  <Upload className="w-8 h-8 text-slate-400 mb-2" />

                  <span className="text-xs font-bold text-slate-700">
                    Click to upload item photograph
                  </span>

                  <span className="text-[11px] text-slate-400 mt-1">
                    JPG, PNG or WEBP · Maximum 5 MB
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative w-full max-w-sm border border-slate-200 rounded-2xl overflow-hidden">

                  <img
                    src={imagePreview}
                    alt="Selected lost item"
                    className="w-full h-56 object-contain bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-white text-rose-600 rounded-full shadow hover:bg-rose-50"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 p-3 bg-white">
                    <ImageIcon className="w-4 h-4 text-green-600" />

                    <span className="text-xs text-slate-600 truncate">
                      {selectedFile?.name}
                    </span>
                  </div>

                </div>
              )}
            </div>

            {/* Last Seen Location */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Last Seen Location <span className="text-rose-500">*</span>
              </label>

              <input
                type="text"
                required
                maxLength={255}
                placeholder="e.g. Science Library 2nd Floor, Cafeteria..."
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
                maxLength={5000}
                placeholder="Describe stickers, scratches, case color, unique keychains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Additional Details */}
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
                  <option value="Campus Email">
                    College Email & In-App Portal
                  </option>

                  <option value="Phone Call">
                    Phone / SMS Only
                  </option>

                  <option value="Security Desk Relay">
                    Security Desk Relay (Strict Privacy)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Additional Notes
                </label>

                <input
                  type="text"
                  maxLength={5000}
                  placeholder="Any other useful details..."
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
                {submitting
                  ? 'Uploading & Submitting...'
                  : 'Publish Lost Item Report'}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
