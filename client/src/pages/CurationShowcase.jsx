import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink, Github, Linkedin, FileText, Star, Globe,
  MapPin, Briefcase, Clock, ChevronDown, ChevronUp, Phone,
  Mail, Award, Code2, X, TrendingUp, Users, Calendar
} from 'lucide-react';
import axios from 'axios';
import { optimizeImage } from '../utils/image';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SECTION_COLORS = {
  'Communication':    { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-500' },
  'Technical Skills': { bg: 'bg-purple-100',  text: 'text-purple-700',  bar: 'bg-purple-500' },
  'Problem Solving':  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'Attitude':         { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500' },
  'Culture Fit':      { bg: 'bg-pink-100',    text: 'text-pink-700',    bar: 'bg-pink-500' },
};

const ratingColor = (r) => r >= 8 ? '#059669' : r >= 6 ? '#D97706' : '#DC2626';
const ratingLabel = (r) => r >= 8.5 ? 'Excellent' : r >= 7 ? 'Good' : r >= 5 ? 'Average' : 'Needs Work';

function formatSalary(val) {
  if (!val) return null;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val}`;
}

// ─── Candidate Detail Modal ────────────────────────────────────────────────────
function CandidateModal({ candidate, onClose }) {
  if (!candidate) return null;
  const { user: u, latestSession: s, projects } = candidate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-t-3xl px-8 py-6 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition">
            <X size={18} />
          </button>
          <div className="flex items-center gap-5">
            {/* Double-layer photo */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 translate-x-2 translate-y-2 bg-[#00A693]/30 rounded-2xl" />
              <img
                src={optimizeImage(u.avatar, 80) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=00A693&color=fff&size=80`}
                alt={u.name}
                className="relative w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div>
              <p className="text-xs text-[#00A693] font-bold mb-1">#{u.regNumber ? String(u.regNumber).padStart(4, '0') : '—'}</p>
              <h2 className="text-2xl font-bold text-white">{u.name}</h2>
              <p className="text-sm text-white/60">{(u.designations || []).join(' · ')}</p>
              {u.place && <p className="text-xs text-white/50 flex items-center gap-1 mt-1"><MapPin size={11} />{[u.place, u.state].filter(Boolean).join(', ')}</p>}
            </div>
            {s && (
              <div className="ml-auto text-center">
                <p className="text-4xl font-black" style={{ color: ratingColor(s.overallRating) }}>{s.overallRating}</p>
                <p className="text-xs text-white/50">/10</p>
                <p className="text-xs font-semibold mt-1" style={{ color: ratingColor(s.overallRating) }}>{ratingLabel(s.overallRating)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {u.yearsOfExperience && <div className="bg-[#F8FAFF] rounded-xl p-3 text-center"><p className="text-xs text-[#9CA3AF] mb-1">Experience</p><p className="font-bold text-[#1A1A1A] text-sm">{u.yearsOfExperience}</p></div>}
            {u.expectedSalary && <div className="bg-[#F8FAFF] rounded-xl p-3 text-center"><p className="text-xs text-[#9CA3AF] mb-1">Expected CTC</p><p className="font-bold text-emerald-600 text-sm">{formatSalary(u.expectedSalary)}</p></div>}
            {u.joiningAvailability && <div className="bg-[#F8FAFF] rounded-xl p-3 text-center"><p className="text-xs text-[#9CA3AF] mb-1">Availability</p><p className="font-bold text-[#1A1A1A] text-sm">{u.joiningAvailability}</p></div>}
            {(u.jobMode || []).length > 0 && <div className="bg-[#F8FAFF] rounded-xl p-3 text-center"><p className="text-xs text-[#9CA3AF] mb-1">Work Mode</p><p className="font-bold text-[#1A1A1A] text-sm">{u.jobMode.join(' / ')}</p></div>}
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-[#374151] mb-3">Contact Details</h3>
            <div className="flex flex-wrap gap-3">
              {u.email && <a href={`mailto:${u.email}`} className="flex items-center gap-2 text-sm text-[#374151] bg-[#F3F0EB] px-3 py-2 rounded-xl hover:bg-[#E5E1DA] transition"><Mail size={14} className="text-[#00A693]" />{u.email}</a>}
              {u.phone && <a href={`tel:${u.phone}`} className="flex items-center gap-2 text-sm text-[#374151] bg-[#F3F0EB] px-3 py-2 rounded-xl hover:bg-[#E5E1DA] transition"><Phone size={14} className="text-[#00A693]" />{u.phone}</a>}
            </div>
          </div>

          {/* Tech Skills */}
          {(u.familiarTech || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#374151] mb-3">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {u.familiarTech.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white text-xs font-medium rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {u.bio && (
            <div>
              <h3 className="text-sm font-bold text-[#374151] mb-2">About</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{u.bio}</p>
            </div>
          )}

          {/* Interview Assessment */}
          {s && (
            <div>
              <h3 className="text-sm font-bold text-[#374151] mb-3">🎯 Interview Assessment</h3>

              {s.headline && (
                <div className="bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm italic text-[#065F46]">"{s.headline}"</p>
                </div>
              )}

              {s.summary && <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{s.summary}</p>}

              {/* Section Ratings */}
              {(s.sections || []).filter(sec => sec.title).length > 0 && (
                <div className="space-y-3 mb-4">
                  {s.sections.map((sec, i) => {
                    const colors = SECTION_COLORS[sec.title] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' };
                    return (
                      <div key={i} className="bg-[#FAF7F2] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{sec.title}</span>
                          <span className="text-sm font-bold text-[#374151]">{sec.rating}/5</span>
                        </div>
                        <div className="w-full bg-[#E5E1DA] rounded-full h-1.5 mb-1">
                          <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${(sec.rating / 5) * 100}%` }} />
                        </div>
                        {sec.notes && <p className="text-xs text-[#9CA3AF] mt-1">{sec.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pros */}
              {(s.pros || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-[#374151] mb-2">✅ Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {s.pros.map((p, i) => <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">{p}</span>)}
                  </div>
                </div>
              )}

              {/* Cons */}
              {(s.cons || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-[#374151] mb-2">⚠️ Areas of Active Development</p>
                  <div className="flex flex-wrap gap-2">
                    {s.cons.map((c, i) => <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">{c}</span>)}
                  </div>
                </div>
              )}

              {/* Tips shown to recruiter as growth areas */}
              {(s.improvementTips || []).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#374151] mb-2">🎯 Current Development Focus</p>
                  <div className="space-y-2">
                    {s.improvementTips.map((t, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-start gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold shrink-0">{t.area}</span>
                        <p className="text-xs text-[#374151]">{t.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {(projects || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#374151] mb-3">🚀 Projects</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map(p => (
                  <div key={p._id} className="border border-[#E5E1DA] rounded-xl overflow-hidden">
                    {p.thumbnail && <img src={optimizeImage(p.thumbnail, 240)} alt={p.title} className="w-full h-28 object-cover" />}
                    <div className="p-3">
                      <p className="font-semibold text-[#1A1A1A] text-sm mb-1">{p.title}</p>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E1DA]">
            {u.portfolioUrl && <a href={u.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] text-white rounded-xl text-xs font-medium hover:bg-[#1E293B] transition"><Globe size={12} />Portfolio</a>}
            {u.linkedinUrl && <a href={u.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#0A66C2] text-white rounded-xl text-xs font-medium hover:bg-[#004182] transition"><Linkedin size={12} />LinkedIn</a>}
            {u.githubUrl && <a href={u.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#24292F] text-white rounded-xl text-xs font-medium hover:bg-[#3D444D] transition"><Github size={12} />GitHub</a>}
            {u.cvUrl && <a href={u.cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#00A693] text-white rounded-xl text-xs font-medium hover:bg-[#008f7e] transition"><FileText size={12} />Resume / CV</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, index, onClick }) {
  const { user: u, latestSession: s } = candidate;

  return (
    <div
      className="bg-white rounded-3xl border border-[#E5E1DA] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      {/* Card top accent */}
      <div className="h-1 bg-gradient-to-r from-[#00A693] via-[#0D9488] to-[#00A693]" />

      <div className="p-6">
        {/* Photo + Reg */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            {/* Double-layer effect */}
            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-[#00A693]/20 rounded-2xl" />
            <img
              src={optimizeImage(u.avatar, 72) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=00A693&color=fff&size=72`}
              alt={u.name}
              className="relative w-18 h-18 w-[72px] h-[72px] rounded-2xl object-cover border-[3px] border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2.5 py-1 rounded-full font-mono font-bold">
              #{u.regNumber ? String(u.regNumber).padStart(4, '0') : '—'}
            </span>
            {s && (
              <div className={`text-center px-3 py-1.5 rounded-xl border`}
                style={{ borderColor: ratingColor(s.overallRating) + '33', backgroundColor: ratingColor(s.overallRating) + '11' }}>
                <span className="text-lg font-black" style={{ color: ratingColor(s.overallRating) }}>{s.overallRating}</span>
                <span className="text-xs text-[#9CA3AF]">/10</span>
              </div>
            )}
          </div>
        </div>

        {/* Name & Role */}
        <h3 className="font-bold text-[#1A1A1A] text-base leading-tight mb-0.5">{u.name}</h3>
        <p className="text-xs text-[#6B7280] mb-1 truncate">{(u.designations || []).join(' · ')}</p>
        {u.place && (
          <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mb-3">
            <MapPin size={10} /> {[u.place, u.state].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(u.familiarTech || []).slice(0, 4).map((t, i) => (
            <span key={i} className="text-[10px] bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white px-2 py-0.5 rounded-full font-medium">{t}</span>
          ))}
          {(u.familiarTech || []).length > 4 && (
            <span className="text-[10px] bg-[#F3F0EB] text-[#9CA3AF] px-2 py-0.5 rounded-full">+{u.familiarTech.length - 4}</span>
          )}
        </div>

        {/* Admin Headline */}
        {s?.headline && (
          <p className="text-xs italic text-[#6B7280] border-l-2 border-[#00A693] pl-2.5 mb-3 line-clamp-2">"{s.headline}"</p>
        )}

        {/* Pros */}
        {(s?.pros || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {s.pros.slice(0, 3).map((p, i) => (
              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">✓ {p}</span>
            ))}
          </div>
        )}

        {/* Cons */}
        {(s?.cons || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {s.cons.slice(0, 2).map((c, i) => (
              <span key={i} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">⚠ {c}</span>
            ))}
          </div>
        )}

        {/* Section mini bars */}
        {(s?.sections || []).filter(sec => sec.title).length > 0 && (
          <div className="space-y-1 mb-4">
            {s.sections.slice(0, 3).map((sec, i) => {
              const colors = SECTION_COLORS[sec.title] || { bar: 'bg-gray-500' };
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] text-[#9CA3AF] w-20 truncate shrink-0">{sec.title}</span>
                  <div className="flex-1 h-1 bg-[#F3F0EB] rounded-full">
                    <div className={`h-1 rounded-full ${colors.bar}`} style={{ width: `${(sec.rating / 5) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF] w-4 text-right">{sec.rating}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Stats */}
        <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-4">
          {u.yearsOfExperience && <span className="flex items-center gap-1"><Briefcase size={10} />{u.yearsOfExperience}</span>}
          {u.expectedSalary && <span className="flex items-center gap-1 text-emerald-600 font-medium"><Award size={10} />{formatSalary(u.expectedSalary)}</span>}
        </div>

        {/* Links */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {u.portfolioUrl && <a href={u.portfolioUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="p-2 bg-[#F3F0EB] rounded-xl hover:bg-[#0F172A] hover:text-white text-[#6B7280] transition"><Globe size={13} /></a>}
            {u.linkedinUrl && <a href={u.linkedinUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="p-2 bg-[#F3F0EB] rounded-xl hover:bg-[#0A66C2] hover:text-white text-[#6B7280] transition"><Linkedin size={13} /></a>}
            {u.githubUrl && <a href={u.githubUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="p-2 bg-[#F3F0EB] rounded-xl hover:bg-[#24292F] hover:text-white text-[#6B7280] transition"><Github size={13} /></a>}
            {u.cvUrl && <a href={u.cvUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="p-2 bg-[#F3F0EB] rounded-xl hover:bg-[#00A693] hover:text-white text-[#6B7280] transition"><FileText size={13} /></a>}
          </div>
          <button className="text-xs bg-gradient-to-r from-[#00A693] to-[#0D9488] text-white px-3 py-1.5 rounded-xl font-medium hover:shadow-lg transition-all">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CurationShowcase() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [jdOpen, setJdOpen] = useState(false);

  useEffect(() => {
    const LOGO_URL = 'https://res.cloudinary.com/di0vbvioi/image/upload/v1780659567/sharemyapp/logo.png';
    axios.get(`${API_BASE}/showcase/${slug}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'This showcase link is unavailable.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00A693] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Showcase Unavailable</h1>
          <p className="text-white/50">{error}</p>
          <p className="text-xs text-white/30 mt-4">ShareMyApps — Where Developers Meet Opportunity</p>
        </div>
      </div>
    );
  }

  const LOGO_URL = 'https://res.cloudinary.com/di0vbvioi/image/upload/v1780659567/sharemyapp/logo.png';

  return (
    <div className="min-h-screen bg-[#F8F7F4]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0D2B3E] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <img src={LOGO_URL} alt="ShareMyApps" className="h-8 object-contain" />
            <div className="h-5 w-px bg-white/20" />
            <span className="text-white/50 text-xs tracking-widest uppercase">Talent Showcase</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">{data.title}</h1>
              {(data.recruiterName || data.companyName) && (
                <p className="text-white/70 text-base flex items-center gap-2">
                  <Users size={16} className="text-[#00A693]" />
                  Curated for <span className="text-white font-semibold ml-1">{[data.recruiterName, data.companyName].filter(Boolean).join(' · ')}</span>
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Users size={13} /> {data.candidates.length} Candidates</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              {[
                { label: 'Candidates', value: data.candidates.length, icon: Users },
                { label: 'Avg Score', value: data.candidates.filter(c => c.latestSession).length > 0
                  ? (data.candidates.filter(c => c.latestSession).reduce((s, c) => s + c.latestSession.overallRating, 0) / data.candidates.filter(c => c.latestSession).length).toFixed(1) + '/10'
                  : '—', icon: Star
                },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-white/10">
                  <p className="text-2xl font-black text-[#00A693]">{stat.value}</p>
                  <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* JD Note */}
          {data.jdNote && (
            <div className="mt-6">
              <button
                onClick={() => setJdOpen(v => !v)}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
              >
                <Code2 size={14} />
                Job Description / Notes
                {jdOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {jdOpen && (
                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap max-h-48 overflow-y-auto border border-white/10">
                  {data.jdNote}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wave */}
        <div className="h-8 relative overflow-hidden">
          <svg viewBox="0 0 1440 32" fill="none" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 32L1440 32L1440 8C1200 28 960 40 720 28C480 16 240 0 0 8L0 32Z" fill="#F8F7F4" />
          </svg>
        </div>
      </div>

      {/* ── Candidate Grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {data.candidates.length === 0 ? (
          <div className="text-center py-20 text-[#9CA3AF]">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No candidates in this showcase yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.candidates.map((candidate, i) => (
              <CandidateCard
                key={candidate.user._id}
                candidate={candidate}
                index={i}
                onClick={() => setSelectedCandidate(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-10 border-t border-[#E5E1DA] mt-8">
        <img src={LOGO_URL} alt="ShareMyApps" className="h-6 object-contain mx-auto mb-2 opacity-50" />
        <p className="text-xs text-[#9CA3AF]">Powered by <span className="font-semibold text-[#00A693]">ShareMyApps</span> — Where Developers Meet Opportunity</p>
        <p className="text-xs text-[#C4C0B8] mt-1">This page is confidential and intended for the recipient only.</p>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}
