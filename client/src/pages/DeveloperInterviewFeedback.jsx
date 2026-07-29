import { useState, useEffect } from 'react';
import { Target, TrendingUp, HelpCircle } from 'lucide-react';
import api from '../api/axios';


const SECTION_COLORS = {
  'Communication':    { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-500' },
  'Technical Skills': { bg: 'bg-purple-100',  text: 'text-purple-700',  bar: 'bg-purple-500' },
  'Problem Solving':  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'Attitude':         { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500' },
  'Culture Fit':      { bg: 'bg-pink-100',    text: 'text-pink-700',    bar: 'bg-pink-500' },
};

const ratingColor = (r) => r >= 8 ? '#059669' : r >= 6 ? '#D97706' : '#DC2626';

export default function DeveloperInterviewFeedback() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interview-feedback')
      .then(res => setSessions(res.data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-40 bg-white rounded-3xl animate-pulse" />
        <div className="h-60 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <TrendingUp className="text-accent" /> My Interview Progress
        </h1>
        <p className="text-muted text-sm mt-1">Review your feedback, focus on improvement areas, and get ready for your dream job.</p>
      </div>

      {sessions.map((session) => (
        <div key={session._id} className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Session #{session.sessionNumber}</p>
              <h2 className="text-xl font-bold">{new Date(session.interviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
              {session.evaluatedBy && <p className="text-white/50 text-xs mt-1">Interviewed by {session.evaluatedBy.name}</p>}
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[120px]">
              <p className="text-3xl font-black" style={{ color: ratingColor(session.overallRating) }}>{session.overallRating}<span className="text-lg text-white/40">/10</span></p>
              <p className="text-[10px] text-white/60 font-medium uppercase mt-0.5">Overall Score</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Headline & Summary */}
            {(session.headline || session.summary) && (
              <div>
                {session.headline && (
                  <h3 className="text-lg font-bold text-text italic mb-2">"{session.headline}"</h3>
                )}
                {session.summary && (
                  <p className="text-muted text-sm leading-relaxed">{session.summary}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Tips */}
              <div>
                <h4 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
                  <Target size={16} className="text-accent" /> Personalized Improvement Tips
                </h4>
                {(!session.improvementTips || session.improvementTips.length === 0) ? (
                  <p className="text-sm text-muted italic">No specific tips provided for this session.</p>
                ) : (
                  <div className="space-y-3">
                    {session.improvementTips.map((tip, i) => (
                      <div key={i} className="bg-[#F0FDF4] border-l-4 border-accent rounded-r-xl p-4">
                        <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded mb-2 inline-block">
                          Focus: {tip.area}
                        </span>
                        <p className="text-sm text-text mb-2 leading-relaxed">{tip.tip}</p>
                        {tip.resourceUrl && (
                          <a href={tip.resourceUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline font-medium inline-flex items-center gap-1">
                            <HelpCircle size={12} /> Open Resource
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Sections & Pros/Cons */}
              <div className="space-y-6">
                {/* Section Ratings */}
                {(session.sections || []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-text mb-3">Category Breakdown</h4>
                    <div className="space-y-3">
                      {session.sections.map((sec, i) => {
                        const colors = SECTION_COLORS[sec.title] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' };
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-text">{sec.title}</span>
                              <span className="text-xs font-bold text-muted">{sec.rating}/5</span>
                            </div>
                            <div className="w-full bg-[#E5E1DA] rounded-full h-1.5 mb-1">
                              <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${(sec.rating / 5) * 100}%` }} />
                            </div>
                            {sec.notes && <p className="text-[10px] text-muted">{sec.notes}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-4">
                  {(session.pros || []).length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-text mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {session.pros.map((p, i) => (
                          <li key={i} className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">✓ {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(session.cons || []).length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-text mb-2">Areas to Improve</h5>
                      <ul className="space-y-1">
                        {session.cons.map((c, i) => (
                          <li key={i} className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">⚠ {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
