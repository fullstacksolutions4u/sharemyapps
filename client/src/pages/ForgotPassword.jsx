import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../api/axios';

const STEPS = ['email', 'otp', 'password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified');
      setStep('password');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src={logo} alt="ShareMyApps" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < stepIndex ? 'bg-accent text-white' : i === stepIndex ? 'bg-accent text-white ring-2 ring-accent/30' : 'bg-[#E5E1DA] text-muted'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-10 h-0.5 rounded ${i < stepIndex ? 'bg-accent' : 'bg-[#E5E1DA]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">

          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Forgot password?</h1>
              <p className="text-sm text-muted mb-6">Enter your email and we'll send you a 6-digit OTP.</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Enter OTP</h1>
              <p className="text-sm text-muted mb-6">
                We sent a 6-digit code to <span className="font-medium text-text">{email}</span>. It expires in 10 minutes.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">6-digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text tracking-widest text-center placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft size={14} /> Change email or resend
                </button>
              </form>
            </>
          )}

          {/* Step 3: New password */}
          {step === 'password' && (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Set new password</h1>
              <p className="text-sm text-muted mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 pr-11 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-muted transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 py-3 pr-11 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-muted transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted mt-5">
          Remember your password?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
