import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Briefcase, Shield, Users } from 'lucide-react';
import api from '../api/axios';
import { optimizeImage } from '../utils/image';
import AppSpinner from '../components/AppSpinner';




export default function SharedProfiles() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJdExpanded, setIsJdExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/vacancies/${id}/shared-profiles`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F3F0EB]"><AppSpinner /></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#1A1A1A] bg-[#FAF7F2]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md w-full border border-[#E5E1DA]">
          <Shield size={48} className="mx-auto mb-4 text-red-500 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-[#6B7280]">{error || 'Profiles not found.'}</p>
        </div>
      </div>
    );
  }

  const { vacancy, sessions } = data;

  return (
    <div className="min-h-screen bg-[#F3F0EB] font-inter">
      {/* Header Section */}
      <header className="bg-white border-b border-[#E5E1DA] pt-12 pb-8 px-6 lg:px-12 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Title & Info */}
            <div className="shrink-0 lg:w-[350px] xl:w-[450px]">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] mb-3 tracking-tight">
                {vacancy.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#6B7280]">
                {vacancy.location && (
                  <span className="flex items-center gap-1.5"><MapPin size={16} /> {vacancy.location}</span>
                )}
                {vacancy.experience && (
                  <span className="flex items-center gap-1.5"><Briefcase size={16} /> {vacancy.experience}</span>
                )}
              </div>
            </div>
            
            {/* Job Description (JD) */}
            {vacancy.description && (
              <div className="flex-1 text-sm text-[#4B5563] leading-relaxed bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E1DA]">
                <div className={isJdExpanded ? "" : "line-clamp-3"}>
                  {vacancy.description}
                </div>
                {vacancy.description.length > 150 && (
                  <button 
                    onClick={() => setIsJdExpanded(!isJdExpanded)}
                    className="text-[#00A693] font-bold mt-2 hover:underline text-xs flex items-center gap-1"
                  >
                    {isJdExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
            
            {/* Candidate Count */}
            <div className="bg-[#FAF7F2] px-6 py-4 rounded-2xl border border-[#E5E1DA] text-center shrink-0 h-fit">
              <div className="text-3xl font-black text-[#00A693]">{sessions.length}</div>
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mt-1">Candidates</div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E5E1DA]">
            <Users size={48} className="mx-auto mb-4 text-[#9CA3AF] opacity-50" />
            <h3 className="text-lg font-bold text-[#1A1A1A]">No candidates available</h3>
            <p className="text-sm text-[#6B7280] mt-2">There are currently no evaluated candidates shortlisted for this vacancy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
            {sessions.map((session, i) => {
              return <CandidateCard key={session._id || i} session={session} vacancyId={id} />;
            })}
          </div>
        )}
      </main>
      
    </div>
  );
}

function CandidateCard({ session, vacancyId }) {
  const u = session.user || {};
  const rating = session.overallRating || 0;

  return (
    <div
      className={`sticky-curly p-6 flex items-center justify-between gap-4`}
      style={{ '--sticky-bg': '#fdf7df', '--sticky-fold': '#e8dfb8' }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <img 
          src={optimizeImage(u.avatar, 80) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=00A693&color=fff`} 
          alt={u.name}
          className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm shrink-0 bg-white"
        />
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-bold text-gray-900 truncate">{u.name || 'Unknown Candidate'}</h3>
          <p className="text-xs text-emerald-700 font-bold truncate">
            {u.designations?.[0] || 'Software Engineer'}
          </p>
          {u.yearsOfExperience && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-black/5 text-gray-700 text-[10px] font-bold rounded uppercase tracking-wider">
              {u.yearsOfExperience} Exp
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100">
          <span className={`text-[16px] font-black leading-none ${rating >= 8 ? 'text-emerald-600' : rating >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{rating}</span>
          <span className="text-[8px] font-bold uppercase opacity-60 mt-0.5 text-gray-500">/10</span>
        </div>
        
        <Link 
          to={`/shared-profiles/${vacancyId}/candidate/${session._id}`}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-[#00A693] text-xs font-bold rounded-lg border border-gray-200 shadow-sm transition-colors flex items-center gap-1"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
