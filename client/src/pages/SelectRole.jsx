import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Code2, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const ROLES = [
  {
    key: 'developer',
    icon: Code2,
    label: 'Developer',
    desc: 'Complete your profile, showcase projects & portfolio, apply for jobs, and get discovered by recruiters.',
    color: 'text-blue-500',
    bg: 'bg-blue-50/70',
    border: 'border-blue-500',
    ring: 'ring-2 ring-blue-500/20',
  },
  {
    key: 'recruiter',
    icon: Briefcase,
    label: 'Recruiter',
    desc: 'Find talented developers, browse portfolios, post vacancies, and hire the best fit.',
    color: 'text-accent',
    bg: 'bg-accent-light/70',
    border: 'border-accent',
    ring: 'ring-2 ring-accent/20',
  },
];

export default function SelectRole() {
  const { user, loading: authLoading, selectRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const completingRef = useRef(false);

  const homeFor = (u) => {
    if (u.role === 'admin') return '/admin';
    if (u.userType === 'recruiter') return '/client-profile';
    return '/feed';
  };

  useEffect(() => {
    if (!authLoading && user?.onboardingComplete && !completingRef.current) {
      navigate(homeFor(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleContinue = async () => {
    if (!selected) {
      toast.error('Please select a role to continue');
      return;
    }

    setLoading(true);
    try {
      const updated = await selectRole(selected);
      toast.success('Welcome aboard!');
      completingRef.current = true;
      if (updated.userType === 'developer') {
        navigate('/dashboard/profile', { replace: true });
      } else {
        navigate(homeFor(updated), { replace: true });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-start px-4 pt-3 sm:pt-5 pb-8 relative">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <img src={logo} alt="ShareMyApps" className="h-8 w-auto mx-auto mb-2.5" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mb-3">
            Welcome, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-muted text-sm">
            Tell us who you are so we can tailor your experience.
          </p>
        </div>

        {/* Square Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 animate-in fade-in slide-in-from-bottom-4">
          {ROLES.map(({ key, icon: Icon, label, desc, color, bg, border, ring }) => {
            const isSelected = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`w-full aspect-square flex flex-col items-center justify-between text-center p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? `${border} ${bg} ${ring} shadow-lg scale-[1.02]`
                    : 'border-border bg-white hover:border-[#C5C0B8] hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                {/* Top Radio Indicator */}
                <div className="w-full flex justify-end">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? `${border} ${bg}` : 'border-[#C5C0B8]'
                  }`}>
                    {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${color.replace('text-', 'bg-')}`} />}
                  </div>
                </div>

                {/* Center Icon & Info */}
                <div className="flex flex-col items-center my-auto">
                  <div className={`w-16 h-16 rounded-2xl ${isSelected ? 'bg-white shadow-xs' : 'bg-[#F3F0EB]'} flex items-center justify-center transition-all mb-4`}>
                    <Icon size={32} className={isSelected ? color : 'text-muted'} />
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${isSelected ? color : 'text-text'}`}>
                    {label}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed px-2 line-clamp-3">
                    {desc}
                  </p>
                </div>

                <div className="h-2" />
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] cursor-pointer"
        >
          {loading ? 'Setting up your account…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
