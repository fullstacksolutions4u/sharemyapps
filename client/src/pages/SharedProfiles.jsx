import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink, Briefcase, FileText, CheckCircle, MapPin, Building2, Star, Target, MessageSquare, Shield, Smile, Users, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import { optimizeImage } from '../utils/image';
import AppSpinner from '../components/AppSpinner';

const ratingColor = (r) => r >= 8 ? 'text-emerald-500' : r >= 6 ? 'text-amber-500' : 'text-red-500';
const bgRatingColor = (r) => r >= 8 ? 'bg-emerald-500' : r >= 6 ? 'bg-amber-500' : 'bg-red-500';

const GithubIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/>
  </svg>
);

const LinkedInIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

function Card3D({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}

function SectionProgressBar({ label, rating, icon: Icon }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-[#00A693]" />}
          {label}
        </span>
        <span className={`text-xs font-bold ${ratingColor(rating)}`}>{rating}/5</span>
      </div>
      <div className="w-full h-1.5 bg-[#E5E1DA] rounded-full overflow-hidden">
        <div 
          className={`h-full ${bgRatingColor(rating * 2)} rounded-full`} 
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

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
                <span className="flex items-center gap-1.5"><Briefcase size={16} /> {vacancy.experience || 'Experience Not Specified'}</span>
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
