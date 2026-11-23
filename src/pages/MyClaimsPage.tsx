import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  Search
} from 'lucide-react';
import { api, Claim } from '../services/api';
import { DashboardSidebar } from '../components/DashboardSidebar';

export const MyClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.getMyClaims();
        setClaims(res.claims || []);
      } catch (err) {
        console.error('Failed to fetch claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved · Ready for Pickup
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-[#635BFF] border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Handover Completed
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Under Administrative Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Claim Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <DashboardSidebar mode="student" />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#635BFF] uppercase tracking-wider">
              Verification & Custody
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              My Ownership Claims
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track the verification status of claims you submitted for items found on campus.
            </p>
          </div>

          <Link
            to="/browse?type=found"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            Browse Found Directory
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-36"></div>
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No active claims filed</h3>
            <p className="text-xs text-slate-400 mt-1">
              If someone turned in your missing property, you can file a claim to verify ownership.
            </p>
            <Link
              to="/browse?type=found"
              className="inline-block mt-4 px-4 py-2 text-xs font-bold text-[#635BFF] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Browse Found Articles
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {claim.item_name || 'Found Article'}
                      </h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-medium">{claim.item_category}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Claimed on {new Date(claim.created_at).toLocaleDateString()}
                      </span>
                      {claim.item_location && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {claim.item_location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(claim.status)}</div>
                </div>

                {/* Ownership Description Provided */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Submitted Proof of Ownership:</span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{claim.ownership_description}</p>
                  {claim.evidence_url && (
                    <div className="mt-2 text-[11px] text-[#635BFF]">
                      <a href={claim.evidence_url} target="_blank" rel="noreferrer" className="underline font-medium">
                        View Supporting Document / Evidence Link
                      </a>
                    </div>
                  )}
                </div>

                {/* Admin Remarks & Next Steps */}
                {claim.admin_remarks && (
                  <div className={`p-4 rounded-xl text-xs space-y-1 ${
                    claim.status === 'Approved'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                      : claim.status === 'Rejected'
                      ? 'bg-rose-50 border border-rose-200 text-rose-950'
                      : 'bg-amber-50 border border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Building className="w-3.5 h-3.5" />
                      <span>Administrative Remarks & Handover Instructions</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">{claim.admin_remarks}</p>

                    {claim.status === 'Approved' && (
                      <div className="pt-2 text-[11px] font-semibold text-emerald-900 border-t border-emerald-200 mt-2">
                        Next Action: Visit the Central Campus Security Desk (Gate 2) with your original student photo ID card to complete physical verification and collection.
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">Claim Ref: {claim.id}</span>
                  <Link
                    to={`/items/${claim.item_id}`}
                    className="font-semibold text-[#635BFF] hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Item Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
