import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Check, X, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import AppSpinner from '../components/AppSpinner';

function ApplicationStepper({ status, history = [], appliedAt }) {
  const s = (status || 'applied').toLowerCase();
  
  const getStageIndex = () => {
    if (s === 'applied') return 0;
    if (s === 'reviewing') return 1;
    if (s === 'contacting') return 2;
    if (s.includes('interview')) return 3;
    if (s === 'selected' || s === 'rejected') return 4;
    return 0;
  };

  const currentIndex = getStageIndex();
  const isRejected = s === 'rejected';

  // Helper to find date for a specific stage from history
  const getStageDate = (stageKeys) => {
    if (!history.length) return null;
    // Reverse array to find the most recent matching status if there are multiple
    const match = [...history].reverse().find(h => stageKeys.some(k => h.status.toLowerCase().includes(k)));
    if (match && match.date) {
      return new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return null;
  };

  const stages = [
    { label: 'Applied', date: getStageDate(['applied']) || (appliedAt ? new Date(appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : null) },
    { label: 'Reviewing', date: getStageDate(['reviewing']) },
    { label: 'Contacting', date: getStageDate(['contacting']) },
    { label: s.includes('interview') ? s.replace(/\b\w/g, l => l.toUpperCase()) : 'Interviewing', date: getStageDate(['interview']) },
    { label: currentIndex === 4 ? (isRejected ? 'Rejected' : 'Selected') : 'Decision', date: getStageDate(['selected', 'rejected']) }
  ];

  return (
    <div className="w-full mt-6">
      <div className="relative flex w-full">
        {/* The background connecting line container */}
        <div className="absolute left-8 right-8 top-3 -translate-y-1/2 h-1 bg-[#E5E1DA] z-0">
          {/* The active progress line */}
          <div 
            className={`h-full transition-all duration-500 ${isRejected ? 'bg-red-500' : 'bg-[#00A693]'}`} 
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }} 
          />
        </div>
        
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          let circleClasses = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-white border-2 border-[#E5E1DA]';
          let textColor = 'text-[#9CA3AF]';
          let icon = null;

          if (isCompleted) {
            circleClasses = `w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 ${isRejected ? 'bg-red-500 border-red-500' : 'bg-[#00A693] border-[#00A693]'}`;
            textColor = 'text-[#1A1A1A] font-medium';
            icon = <Check size={16} className="text-white" strokeWidth={3} />;
          } else if (isCurrent) {
            circleClasses = `w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-white border-4 ${isRejected ? 'border-red-500' : 'border-[#00A693]'}`;
            textColor = isRejected ? 'text-red-600 font-medium' : 'text-[#1A1A1A] font-semibold';
            // Current step is hollow in the new design (no icon inside)
          }

          if (isCurrent && isRejected) {
            icon = <X size={16} className="text-red-500" strokeWidth={3} />;
          }
          if (isCurrent && s === 'selected') {
            circleClasses = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-[#00A693] border-[#00A693]';
            icon = <Check size={16} className="text-white" strokeWidth={3} />;
          }

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center relative w-16 group z-10 shrink-0">
                <div className={circleClasses}>
                  {icon}
                </div>
                <div className="flex flex-col items-center mt-3 text-center leading-tight">
                  <span className={`text-xs ${textColor}`}>
                    {stage.label}
                  </span>
                  {stage.date && (
                    <span className={`text-[10px] mt-1 ${isCurrent ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                      {stage.date}
                    </span>
                  )}
                </div>
              </div>

              {/* Interleaved Arrow in the gap */}
              {index < stages.length - 1 && (
                <div className="flex-1 flex justify-center items-start pt-[2px] z-10 pointer-events-none">
                  <div className="bg-white px-1">
                    <ChevronRight 
                      size={18} 
                      strokeWidth={3} 
                      className={(index < currentIndex) ? (isRejected && index === currentIndex - 1 ? 'text-red-500' : 'text-[#00A693]') : 'text-[#E5E1DA]'} 
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/applications')
      .then(res => setApplications(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E1DA] rounded-2xl">
          <FileText size={48} className="text-[#9CA3AF] mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[#1A1A1A] mb-2">No applications yet</h2>
          <p className="text-sm text-[#6B7280]">
            You haven't applied to any job opportunities on the platform yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="bg-white border border-[#E5E1DA] rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h3 className="text-base sm:text-lg font-medium text-[#1A1A1A]">{app.title}</h3>
                    {app.location && (
                      <span className="flex items-center gap-1 text-sm text-[#6B7280]">
                        <MapPin size={14} /> {app.location}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {app.jobStatus === 'closed' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      Job Closed
                    </span>
                  )}
                </div>
              </div>
              
              <ApplicationStepper status={app.applicantStatus} history={app.statusHistory} appliedAt={app.appliedAt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
