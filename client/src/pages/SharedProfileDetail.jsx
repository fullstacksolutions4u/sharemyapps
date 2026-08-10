import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink, Briefcase, FileText, CheckCircle, MapPin, Building2, Star, Target, MessageSquare, Shield, Smile, ArrowLeft } from 'lucide-react';
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

export default function SharedProfileDetail() {
  const { id, sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vacancies/${id}/shared-profiles`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load candidate details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <AppSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error || 'Unable to load profile data.'}</p>
        </div>
      </div>
    );
  }

  const { vacancy, sessions } = data;
  const session = sessions.find(s => s._id === sessionId);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
          <p className="text-gray-600 mb-6">This candidate could not be found or has not been shortlisted.</p>
          <Link to={`/shared-profiles/${id}`} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
            Return to List
          </Link>
        </div>
      </div>
    );
  }

  const u = session.user || {};
  const rating = session.overallRating || 0;
  
  const getSectionRating = (title) => {
    const sec = session.sections?.find(s => s.title === title);
    return sec ? sec.rating : 0;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#00A693] selection:text-white pb-12">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E1DA] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to={`/shared-profiles/${id}`} 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Candidates
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00A693]/10 flex items-center justify-center">
              <Building2 size={16} className="text-[#00A693]" />
            </div>
            <span className="font-bold text-gray-900 truncate max-w-[200px]">{vacancy.title}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 mt-8">
        <div
          className={`sticky-curly p-8 md:p-10 flex flex-col gap-8 w-full`}
          style={{ '--sticky-bg': '#fdf7df', '--sticky-fold': '#e8dfb8' }}
        >
          {/* Top Info Section */}
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            <div className="flex items-start gap-5 min-w-0 flex-1">
              <img 
                src={optimizeImage(u.avatar, 120) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=00A693&color=fff&size=120`} 
                alt={u.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md shrink-0 bg-white"
              />
              <div className="min-w-0 pt-1">
                <h1 className="text-3xl font-black text-gray-900 mb-1">{u.name || 'Unknown Candidate'}</h1>
                <p className="text-base text-emerald-700 font-bold mb-2">
                  {u.designations?.[0] || 'Software Engineer'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {u.yearsOfExperience && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/5 text-gray-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
                      <Briefcase size={12} /> {u.yearsOfExperience} Exp
                    </span>
                  )}
                  {u.location && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/5 text-gray-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
                      <MapPin size={12} /> {u.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-100">
              <span className={`text-4xl font-black leading-none ${rating >= 8 ? 'text-emerald-600' : rating >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{rating}</span>
              <span className="text-[10px] font-bold uppercase opacity-60 mt-1.5 text-gray-500">Overall Score</span>
            </div>
          </div>

          <hr className="border-black/5" />

          {/* Headline & Summary */}
          <div className="flex flex-col gap-5">
            {session.headline && (
              <h2 className="text-xl font-bold text-gray-800 leading-snug border-l-4 border-[#00A693] pl-4">
                "{session.headline}"
              </h2>
            )}
            
            {session.summary && (
              <p className="text-base text-gray-700 leading-relaxed max-w-3xl">
                {session.summary}
              </p>
            )}
          </div>

          {/* Detailed Layout: Pros/Cons & Evaluation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            
            {/* Pros/Cons */}
            <div className="flex flex-col gap-6">
              {session.pros?.length > 0 && (
                <div className="bg-white/40 p-5 rounded-2xl">
                  <h5 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle size={16} /> Key Strengths
                  </h5>
                  <ul className="space-y-2.5">
                    {session.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-gray-800 flex items-start gap-2.5 leading-relaxed">
                        <span className="text-emerald-500 shrink-0 text-lg leading-none mt-0.5">•</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {session.cons?.length > 0 && (
                <div className="bg-white/40 p-5 rounded-2xl">
                  <h5 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={16} /> Areas for Growth
                  </h5>
                  <ul className="space-y-2.5">
                    {session.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-gray-800 flex items-start gap-2.5 leading-relaxed">
                        <span className="text-amber-500 shrink-0 text-lg leading-none mt-0.5">•</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Evaluation Breakdown */}
            <div className="bg-white/80 rounded-3xl p-6 md:p-8 border border-white shadow-sm flex flex-col gap-2 h-fit">
              <h4 className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Target size={16} /> Detailed Evaluation
              </h4>
              
              <SectionProgressBar label="Communication" rating={getSectionRating('Communication') || 3} icon={MessageSquare} />
              <div className="h-4"></div>
              <SectionProgressBar label="Technical Skills" rating={getSectionRating('Technical Skills') || 3} icon={Star} />
              <div className="h-4"></div>
              <SectionProgressBar label="Problem Solving" rating={getSectionRating('Problem Solving') || 3} icon={Shield} />
              <div className="h-4"></div>
              <SectionProgressBar label="Attitude & Fit" rating={getSectionRating('Attitude') || getSectionRating('Culture Fit') || 4} icon={Smile} />
            </div>

          </div>

          <hr className="border-black/5 mt-4" />

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Contact:</span>
              {u.linkedinUrl && (
                <a href={u.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-[#0077B5] shadow-sm transition-colors" title="LinkedIn">
                  <LinkedInIcon size={16} />
                </a>
              )}
              {u.githubUrl && (
                <a href={u.githubUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-[#333] shadow-sm transition-colors" title="GitHub">
                  <GithubIcon size={16} />
                </a>
              )}
              {u.portfolioUrl && (
                <a href={u.portfolioUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-[#00A693] shadow-sm transition-colors" title="Portfolio">
                  <ExternalLink size={16} />
                </a>
              )}
              {u.email && (
                <a href={`mailto:${u.email}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-rose-500 shadow-sm transition-colors" title={`Email: ${u.email}`}>
                  <Mail size={16} />
                </a>
              )}
              {u.phone && (
                <a href={`tel:${u.phone}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-blue-500 shadow-sm transition-colors" title={`Phone: ${u.phone}`}>
                  <Phone size={16} />
                </a>
              )}
            </div>

            {/* Resume Link */}
            {u.cvUrl && (
              <a 
                href={u.cvUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl text-[13px] font-bold transition-colors border border-rose-200"
              >
                <FileText size={16} /> View Full Resume
              </a>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
