import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function homeFor(user) {
  if (user.role === 'admin') return '/admin';
  if (!user.onboardingComplete) return '/select-role';
  if (user.userType === 'recruiter') return user.companyName ? '/find-developers' : '/client-profile';
  if (user.userType === 'client') return user.clientProfile?.projectName ? '/portfolios' : '/client-profile';
  if (user.userType === 'mentee') return '/portfolios';
  return '/dashboard';
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('signup') === '1' ? 'signup' : 'signin');
  const [isInAppBrowser] = useState(() => {
    // Detect in-app browsers and standard Android WebViews which block Google OAuth
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /FB_IAB|FB4A|FBAV|FBAN|Instagram|LinkedInApp|Line|snapchat|TikTok|wv/i.test(ua);
  });

  // Sign in state
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up state
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '' });
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  if (params.get('error') === 'oauth') {
    toast.error('Google sign-in failed. Try again.');
  } else if (params.get('error') === 'blocked') {
    toast.error('Your account has been suspended by an administrator.');
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    try {
      const user = await login(signInForm.email, signInForm.password);
      toast.success('Welcome back!');
      navigate(homeFor(user));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSignUpLoading(true);
    try {
      await register(signUpForm.name, signUpForm.email, signUpForm.password);
      toast.success('Account created!');
      navigate('/select-role');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center px-6 pt-26 pb-0">
      <div className="flex items-start gap-16">

        {/* Left: logo + Google */}
        <div className="hidden lg:flex flex-col items-center gap-4 shrink-0">
          <h1 className="text-2xl font-bold text-text tracking-tight">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <Link to="/">
            <img src={logo} alt="ShareMyApps" className="h-64 w-auto" />
          </Link>
          {isInAppBrowser ? (
            <div className="text-center p-3 border border-yellow-200 bg-yellow-50 rounded-xl w-full">
              <p className="text-sm text-yellow-800 font-medium mb-1">In-app browser detected</p>
              <p className="text-xs text-yellow-700">
                Google Sign-In is blocked here. Tap the menu icon (•••) and select <strong>Open in Browser / Chrome</strong> to sign in with Google.
              </p>
            </div>
          ) : (
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
              className="flex items-center justify-center gap-3 w-full border border-border hover:border-text bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-text transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </a>
          )}
        </div>

        {/* Right: tabs + form */}
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-4 lg:hidden">
            <Link to="/"><img src={logo} alt="ShareMyApps" className="h-10 w-auto" /></Link>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-bg border border-border rounded-xl p-1 mb-4">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'signin' ? 'bg-white text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'signup' ? 'bg-white text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={signInForm.email}
                    onChange={e => setSignInForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      required
                      value={signInForm.password}
                      onChange={e => setSignInForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button type="button" onClick={() => setShowSignInPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-muted transition-colors">
                      {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover font-medium">Forgot password?</Link>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {signInLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Full name</label>
                  <input
                    type="text"
                    required
                    value={signUpForm.name}
                    onChange={e => setSignUpForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={signUpForm.email}
                    onChange={e => setSignUpForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      value={signUpForm.password}
                      onChange={e => setSignUpForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 pr-11 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button type="button" onClick={() => setShowSignUpPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-muted transition-colors">
                      {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {signUpLoading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}

            {/* Google sign-in for mobile/tablet — desktop shows it in the left column */}
            <div className="lg:hidden">
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {isInAppBrowser ? (
                <div className="text-center p-3 border border-yellow-200 bg-yellow-50 rounded-xl w-full mt-2">
                  <p className="text-sm text-yellow-800 font-medium mb-1">In-app browser detected</p>
                  <p className="text-xs text-yellow-700">
                    Google Sign-In is blocked here. Tap the menu icon (•••) and select <strong>Open in Browser / Chrome</strong>.
                  </p>
                </div>
              ) : (
                <a
                  href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
                  className="flex items-center justify-center gap-3 w-full border border-border hover:border-text bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-text transition-colors"
                >
                  <GoogleIcon />
                  Continue with Google
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
