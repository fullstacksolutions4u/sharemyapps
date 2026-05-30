import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { Code2, Briefcase } from 'lucide-react';

const ROLES = [
  { key: 'developer', icon: Code2,     label: 'Developer / Applicant' },
  { key: 'client',    icon: Briefcase, label: 'Client / Recruiter' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState('developer');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, userType);
      toast.success('Account created!');
      if (user.role === 'admin') navigate('/admin');
      else if (user.userType === 'client') navigate('/client-profile');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-4">
      <div className="flex items-center gap-16">
        {/* Logo */}
        <div className="hidden lg:flex flex-col items-center gap-4 shrink-0">
          <h1 className="text-2xl font-bold text-text tracking-tight">Create your account</h1>
          <Link to="/">
            <img src={logo} alt="ShareMyApps" className="h-48 w-auto" />
          </Link>
          <a
            href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full border border-[#E5E1DA] hover:border-[#1A1A1A] bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-[#1A1A1A] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>
          <p className="text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00A693] hover:text-[#007D6F] font-medium">Sign in</Link>
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-2xl">
          {/* Mobile logo */}
          <div className="flex justify-center mb-4 lg:hidden">
            <Link to="/">
              <img src={logo} alt="ShareMyApps" className="h-10 w-auto" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-4 lg:hidden">Create your account</h1>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ROLES.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setUserType(key)}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                  userType === key
                    ? 'border-[#00A693] bg-[#E6F7F5] text-[#00A693]'
                    : 'border-[#E5E1DA] bg-white text-[#6B7280] hover:border-[#00A693]/40 hover:text-[#1A1A1A]'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 shadow-sm space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                  {userType === 'client' ? 'Your name' : 'Full name'}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={userType === 'client' ? 'Your name' : 'Your full name'}
                  className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                  {userType === 'client' ? 'Work email' : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00A693] hover:bg-[#007D6F] text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating account…' : userType === 'client' ? 'Create client account' : 'Create developer account'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );

}
