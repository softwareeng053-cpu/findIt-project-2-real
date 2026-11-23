import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#635BFF] flex items-center justify-center text-white">
                <Search className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">Findlt</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Smart Campus Lost & Found Management System. Connecting students, faculty, and administrative security officers to return lost articles with verified chain-of-custody.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Security Verified</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-white tracking-tight">Platform</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">Browse Found Directory</Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-white transition-colors">Report Lost Belonging</Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-white transition-colors">Turn in Found Article</Link>
              </li>
              <li>
                <Link to="/student/dashboard" className="hover:text-white transition-colors">Student Activity Portal</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Campus Login</Link>
              </li>
            </ul>
          </div>

          {/* Drop-off & Security Desks */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-white tracking-tight">Handover Locations</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Central Security Desk (Gate 2) · Open 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Main Library Circulation Counter · 8am - 10pm</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Student Administration Room 102 · Mon-Fri</span>
              </li>
            </ul>
          </div>

          {/* Campus Helpline */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-white tracking-tight">Campus Assistance</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-slate-300">Security Hotline: (555) 019-9000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">lostfound@campus.edu</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                Bring your student ID card or official photo credentials when retrieving approved claims at the security counter.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <p>© 2026 Findlt Campus Management System. BCA Major Project.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacy Safeguarded</span>
            <span>·</span>
            <span>Zero Student Telemetry</span>
            <span>·</span>
            <span>University Safety Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
