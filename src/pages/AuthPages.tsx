import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Shield, ArrowRight, UserCheck, Key, Lock, Mail, User, School, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/student/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    const success = await login(identifier, password);
    setLoading(false);
    if (success) {
      if (identifier.toLowerCase().includes('admin') || identifier.toLowerCase().includes('adm-8801')) {
        navigate('/admin/dashboard');
      } else {
        navigate(redirect);
      }
    }
  };

  const fillQuickDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#635BFF] flex items-center justify-center text-white shadow-sm">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Findlt</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Campus Portal Login
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in using your student campus ID or authorized administrative email.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-900/5 sm:rounded-3xl sm:px-10 border border-slate-200">
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Campus Email or Student ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-2024-042 or alex.j@campus.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#635BFF] focus:ring-0"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Campus security reset: In demonstration mode, please use the 1-click test credentials below.')}
                className="text-[#635BFF] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-md shadow-[#635BFF]/30 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick 1-Click Demo Accounts:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@campus.edu', 'Admin@123')}
                className="w-full p-2 rounded-xl text-left border border-amber-200 bg-amber-50 hover:bg-amber-100/70 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-bold text-amber-950">Campus Administrator</span>
                </div>
                <span className="font-mono text-[10px] text-amber-700">admin@campus.edu</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('alex.j@campus.edu', 'Student@123')}
                className="w-full p-2 rounded-xl text-left border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/70 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span className="font-bold text-indigo-950">Alex Johnson (Student)</span>
                </div>
                <span className="font-mono text-[10px] text-indigo-700">CS-2024-042</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('sarah.m@campus.edu', 'Student@123')}
                className="w-full p-2 rounded-xl text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-bold text-slate-900">Sarah Miller (Student)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600">CS-2024-118</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            New student or faculty member?{' '}
            <Link to="/register" className="font-bold text-[#635BFF] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [course, setCourse] = useState('BCA');
  const [semester, setSemester] = useState('4th Semester');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Validation Error', 'Password and confirmation password do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const success = await register({
      full_name: fullName,
      campus_id: campusId,
      email,
      password,
      confirm_password: confirmPassword,
      department,
      course,
      semester,
      phone
    });
    setLoading(false);

    if (success) {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] flex items-center justify-center text-white shadow-sm">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Findlt</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Register Student / Staff Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Create your campus profile to report lost belongings and claim turned-in items.
          </p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name & Campus ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Campus ID / Roll No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-2024-550"
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden uppercase font-mono"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  College Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya.c@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Department & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">Department</label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">Course</label>
                <input
                  type="text"
                  required
                  placeholder="BCA / B.Tech"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">Semester / Year</label>
                <input
                  type="text"
                  required
                  placeholder="4th Sem"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#635BFF] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
              Security Notice: Campus security verifies your student ID card against registrar records during physical item collection.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5046E5] rounded-xl transition-all shadow-md shadow-[#635BFF]/30 disabled:opacity-50"
            >
              {loading ? 'Creating Campus Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#635BFF] hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
