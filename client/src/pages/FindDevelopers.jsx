import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function FindDevelopers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'recruiter' && user.userType !== 'client') {
      navigate('/developers', { replace: true });
    }
  }, [user, navigate]);

  const handleSearch = async () => {
    if (!jd.trim()) return toast.error('Paste a job description first.');
    if (jd.trim().length < 30) return toast.error('Job description is too short.');

    setLoading(true);
    try {
      const { data } = await api.post('/users/find-developers', { jd: jd.trim() });

      await api.post('/jd/history', {
        jd: jd.trim(),
        extracted: data.extracted,
        resultCount: data.developers.length,
        developers: data.developers,
      });

      navigate('/find-developers/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users size={18} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text">Find Developers</h1>
        </div>
        <p className="text-sm text-muted ml-12">Paste your job description — AI matches the best developers and saves the results.</p>
      </div>

      {/* JD Input */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <label className="block text-sm font-semibold text-text mb-2">Job Description</label>
        <textarea
          rows={10}
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here — role, responsibilities, required skills, experience level..."
          disabled={loading}
          className="w-full text-sm text-text placeholder-muted bg-bg border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 transition disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted">{jd.length} chars</span>
          <button
            onClick={handleSearch}
            disabled={loading || !jd.trim()}
            className="flex items-center gap-2 text-sm bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-medium transition-colors"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Finding Developers…</>
              : <><Search size={14} /> Find Matching Developers</>}
          </button>
        </div>
      </div>
    </div>
  );
}
