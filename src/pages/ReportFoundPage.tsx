
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
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

  const [foundDate, setFoundDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [foundLocation, setFoundLocation] = useState('');
  const [submittedTo, setSubmittedTo] = useState(
    'Central Campus Security Desk (Gate 2)'
  );
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Actual image file and preview
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

  const dropOffLocations = [
    'Central Campus Security Desk (Gate 2)',
    'Main Science Library Circulation Desk',
    'Campus Administration Office Room 102',
    'Student Union Helpdesk',
    'Hostel / Dormitory Security Guard Post',
    'Sports Complex Reception Counter'
  ];

  // Create and clean up image preview URL
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

  // Image selection and validation
  const handleImageUpload = (
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
        'Please select a JPG, PNG, or WEBP image.'
      );
      e.target.value = '';
      return;
    }

    // Backend limit is 5 MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        'File Too Large',
        'Please select an image under 5 MB.'
      );
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    toast.info(
      'Image Selected',
      'Your image is ready to upload.'
    );
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedFile(null);

    const fileInput = document.getElementById(
      'found-item-image'
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Submit found item report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info(
        'Login Required',
        'Please log in to submit a found item report.'
      );

      navigate('/login?redirect=/report-found');
      return;
    }

    if (
      !itemName.trim() ||
      !category ||
      !description.trim() ||
      !foundLocation.trim() ||
      !foundDate ||
      !submittedTo
    ) {
      toast.error(
        'Validation Error',
        'Please complete all required fields.'
      );
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = '';

      // Step 1: Upload image to Supabase Storage
      if (selectedFile) {
        toast.info(
          'Uploading Image',
          'Please wait while your image is uploaded.'
        );

        const uploadResponse = await api.uploadImage(selectedFile);

        if (!uploadResponse?.url) {
          throw new Error(
            'Image upload failed. Please try again.'
          );
        }

        imageUrl = uploadResponse.url;
      }

      // Step 2: Save report with uploaded public image URL
      await api.reportFound({
        item_name: itemName.trim(),
        category,
        description: description.trim(),
        brand: brand.trim(),
        color: color.trim(),
        image_url: imageUrl,
        found_date: foundDate,
        found_location: foundLocation.trim(),
        submitted_to: submittedTo,
        additional_notes: additionalNotes.trim()
      });

      toast.success(
        'Found Item Logged',
        'Thank you! Your found item report has been submitted successfully.'
      );

      navigate('/browse');

    } catch (err: any) {
      console.error('Found item submission error:', err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit found item report.';

      toast.error('Submission Failed', message);

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

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10">

          {/* Header */}
          <div className="border-b border-slate-100 pb-6 mb-6">
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Good Samaritan Submission
            </span>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Turn In / Report a Found Item
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Report an item you found on campus so its owner
              can be identified and contacted.
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
                placeholder="e.g. Laptop, Headphones, Wallet..."
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

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Item Photograph{' '}
                <span className="text-slate-400 font-normal">
                  (Optional)
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">

                {/* Image Preview */}
                <div className="w-full sm:w-44 h-36 rounded-xl bg-slate-200 overflow-hidden relative shrink-0 border border-slate-300">

                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Found item preview"
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />

                      <span className="text-[10px]">
                        No image selected
                      </span>
                    </div>
                  )}

                </div>

                {/* Upload Control */}
                <div className="flex-1 space-y-3">

                  <p className="text-xs text-slate-600">
                    Upload an actual photograph of the found item.
                    JPG, PNG and WEBP formats are supported.
                  </p>

                  <label
                    htmlFor="found-item-image"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />

                    <span>
                      {selectedFile ? 'Change Image' : 'Choose Image'}
                    </span>
                  </label>

                  <input
                    id="found-item-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {selectedFile && (
                    <p className="text-[11px] text-emerald-600 font-medium">
                      Selected: {selectedFile.name}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Maximum image size: 5 MB
                  </p>

                </div>
              </div>
            </div>

            {/* Found Location and Submitted To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Location Found <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Science Library Room 204..."
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Submitted To / Custody Point{' '}
                  <span className="text-rose-500">*</span>
                </label>

                <select
                  value={submittedTo}
                  onChange={(e) => setSubmittedTo(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                >
                  {dropOffLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
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
                placeholder="Describe the item's condition, brand, and other identifying details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Brand and Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Brand (Optional)
                </label>

                <input
                  type="text"
                  placeholder="e.g. Apple, Samsung..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Color (Optional)
                </label>

                <input
                  type="text"
                  placeholder="e.g. Black, Blue..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Custody Notes / Locker Number{' '}
                <span className="text-slate-400 font-normal">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                placeholder="e.g. Deposited at campus security desk..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
              />
            </div>

            {/* Form Buttons */}
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
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-md shadow-[#635BFF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Uploading / Registering...'
                  : 'Register Found Item'}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
