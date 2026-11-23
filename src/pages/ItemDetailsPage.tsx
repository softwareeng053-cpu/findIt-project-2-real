import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building,
  Tag,
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { api, Item } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';

export const ItemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimModalOpen, setClaimModalOpen] = useState(searchParams.get('action') === 'claim');
  const [ownershipDescription, setOwnershipDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const res = await api.getItem(id);
        setItem(res.item);
      } catch (err: any) {
        toast.error('Item Not Found', 'Could not locate this item in the campus registry.');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, navigate, toast]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Login Required', 'Please log in with your college credentials to file an official claim.');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!ownershipDescription.trim()) {
      toast.error('Validation Error', 'Please describe specific identifying markers to prove ownership.');
      return;
    }

    setSubmittingClaim(true);
    try {
      await api.submitClaim({
        item_id: item!.id,
        ownership_description: ownershipDescription.trim(),
        evidence_url: evidenceUrl.trim() || undefined
      });
      toast.success('Claim Submitted!', 'Campus security and administrators have received your ownership claim.');
      setClaimModalOpen(false);
      // Refresh item state
      const updated = await api.getItem(item!.id);
      setItem(updated.item);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit claim.';
      toast.error('Claim Error', msg);
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-24 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back button */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>

        {/* Main Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
            {/* Left Image Section */}
            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-slate-50/50">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-4/3 flex items-center justify-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">No photograph attached</p>
                    <p className="text-[11px] text-slate-400 mt-1">This report is cataloged by text markers.</p>
                  </div>
                )}

                {/* Status Indicator Pill */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-xs ${
                    item.status === 'open'
                      ? 'bg-emerald-500 text-white'
                      : item.status === 'claimed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-800 text-white'
                  }`}>
                    {item.status === 'open'
                      ? item.item_type === 'found' ? 'Awaiting Owner' : 'Still Missing'
                      : item.status === 'claimed' ? 'Claim Under Review' : 'Successfully Returned'}
                  </span>
                </div>
              </div>

              {/* Custody Information */}
              <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#635BFF]" />
                  <span>Campus Chain of Custody</span>
                </div>
                <p className="text-indigo-900 leading-relaxed text-[11px]">
                  {item.submitted_to
                    ? `Physical article is securely deposited at: ${item.submitted_to}`
                    : 'Report logged in the campus directory. Security officers have been alerted.'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 font-mono">
                  <Lock className="w-3 h-3" />
                  <span>Finder credentials protected · Handover requires verified student ID</span>
                </div>
              </div>
            </div>

            {/* Right Information Section */}
            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                
                {/* Type & Category */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md tracking-wider ${
                    item.item_type === 'found' ? 'bg-[#635BFF] text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {item.item_type === 'found' ? 'Found Article' : 'Lost Report'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {item.item_name}
                </h1>

                {/* Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {item.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Brand / Make</span>
                    <span className="font-semibold text-slate-800">{item.brand || 'Unbranded / Not specified'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Color</span>
                    <span className="font-semibold text-slate-800">{item.color || 'Not specified'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {item.item_type === 'found' ? 'Location Found' : 'Last Seen Location'}
                    </span>
                    <span className="font-semibold text-slate-800">{item.location}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date Reported</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{item.report_date}</span>
                  </div>
                </div>

                {item.additional_notes && (
                  <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                    <span className="font-bold text-amber-900 block mb-0.5">Additional Notes:</span>
                    <span>{item.additional_notes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {item.item_type === 'found' && (
                  <>
                    {item.status === 'returned' ? (
                      <div className="p-3.5 bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-600">
                        This item has already been successfully verified and returned to its owner.
                      </div>
                    ) : (
                      <button
                        onClick={() => setClaimModalOpen(true)}
                        className="w-full py-3 px-4 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-md shadow-[#635BFF]/30 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Claim This Item (Prove Ownership)
                      </button>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Reference ID: <strong className="font-mono text-slate-600">{item.id}</strong></span>
                  <span>Safety Policy #8801</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* CLAIM SUBMISSION MODAL */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title={`File Ownership Claim: ${item.item_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-bold">Claiming Guidelines:</p>
            <p className="text-[11px] leading-relaxed">
              Describe identifying characteristics that only the true owner would know (e.g. desktop background, serial numbers, engraving, lock combinations, contents inside pockets).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Claimant Campus Profile
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-0.5">
              <p className="font-semibold text-slate-900">{user?.full_name || 'Guest (Login required)'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{user?.campus_id} · {user?.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Proof of Ownership & Identification Markers <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. 'The laptop has an Apple sticker on the bottom left and a small dent on the headphone port. The lockscreen is a picture of my dog. The serial number ends in 894F'..."
              value={ownershipDescription}
              onChange={(e) => setOwnershipDescription(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supporting Evidence URL / Receipt link <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Link to purchase invoice, serial registration, or photo proof"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setClaimModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingClaim}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors disabled:opacity-50"
            >
              {submittingClaim ? 'Submitting Claim...' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
