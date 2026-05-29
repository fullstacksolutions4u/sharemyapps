import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-[#1A1A1A] text-lg mb-6">
            <span className="w-8 h-8 rounded-lg bg-[#E8734A] flex items-center justify-center text-white font-bold">F</span>
            FindMyApp
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Create your account</h1>
          <p className="text-sm text-[#6B7280] mt-1">List your side projects for free</p>
        </div>

        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 shadow-sm space-y-4">
          {/* Google OAuth */}
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

          <div className="flex items-center gap-3">
            <hr className="flex-1 border-[#E5E1DA]" />
            <span className="text-xs text-[#6B7280]">or</span>
            <hr className="flex-1 border-[#E5E1DA]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/10 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/10 transition"
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
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/10 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8734A] hover:bg-[#D4612F] text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#E8734A] hover:text-[#D4612F] font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
