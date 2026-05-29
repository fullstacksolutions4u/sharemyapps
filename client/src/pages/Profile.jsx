import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Link2, GitBranch, Code2, Save } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-[#6B7280]">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

function Field({ icon, label, name, value, onChange, placeholder, type = 'text', readOnly = false, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-2">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition ${readOnly ? 'bg-[#F9F8F6] cursor-not-allowed text-[#9CA3AF]' : 'bg-white'}`}
        />
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '',
    leetcodeUrl: user?.leetcodeUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-1">Your Profile</h1>
      <p className="text-sm text-[#6B7280] mb-8">This info is shown to people who view your projects.</p>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white border border-[#E5E1DA] rounded-2xl">
        {user?.avatar
          ? <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
          : <span className="w-14 h-14 rounded-full bg-[#00A693] text-white text-xl font-bold flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase()}
            </span>
        }
        <div>
          <p className="font-semibold text-[#1A1A1A]">{user?.name}</p>
          <p className="text-sm text-[#6B7280]">{user?.email}</p>
          {user?.isGoogleUser && (
            <span className="text-xs text-[#9CA3AF] mt-0.5 block">Signed in with Google</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic */}
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Basic Info</h2>
          <Field
            icon={<User size={15} />}
            label="Full name"
            name="name"
            value={form.name}
            onChange={handle}
            placeholder="Your full name"
          />
          <Field
            icon={<Mail size={15} />}
            label="Email"
            name="email"
            value={user?.email || ''}
            placeholder=""
            readOnly
            hint="Email cannot be changed"
          />
          <Field
            icon={<Phone size={15} />}
            label={<>Mobile <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>}
            name="phone"
            value={form.phone}
            onChange={handle}
            placeholder="+1 234 567 8900"
            type="tel"
          />
        </div>

        {/* Social / Developer links */}
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Developer Links <span className="text-xs text-[#9CA3AF] font-normal">(all optional)</span></h2>
          <Field
            icon={<Link2 size={15} />}
            label="LinkedIn"
            name="linkedinUrl"
            value={form.linkedinUrl}
            onChange={handle}
            placeholder="linkedin.com/in/yourprofile"
          />
          <Field
            icon={<GitBranch size={15} />}
            label="GitHub"
            name="githubUrl"
            value={form.githubUrl}
            onChange={handle}
            placeholder="github.com/yourusername"
          />
          <Field
            icon={<LeetCodeIcon />}
            label="LeetCode"
            name="leetcodeUrl"
            value={form.leetcodeUrl}
            onChange={handle}
            placeholder="leetcode.com/yourusername"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
