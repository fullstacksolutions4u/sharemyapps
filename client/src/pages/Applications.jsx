import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Check, X, ChevronRight, Home, Info, Video } from 'lucide-react';
import api from '../api/axios';
import AppSpinner from '../components/AppSpinner';

function ApplicationStepper({ status, history = [], appliedAt, googleMeetLink, interviewedAt }) {
  const s = (status || 'applied').toLowerCase();
  
  const getStageData = (stageKeys) => {
    if (!history.length) return { date: null, note: null };
    const match = [...history].reverse().find(h => stageKeys.some(k => h.status.toLowerCase().includes(k)));
    if (match) {
      return {
        date: match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
        note: match.note?.trim() ? match.note.trim() : null
      };
    }
    return { date: null, note: null };
  };

  const isRejected = s === 'rejected';
  const isSelected = s === 'selected';

  const appliedData = getStageData(['applied']);
  const baseStages = [
    { label: 'Applied', note: appliedData.note, date: appliedData.date || (appliedAt ? new Date(appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : null) },
    { label: 'Reviewing', ...getStageData(['reviewing']) },
    { label: 'Contacted', ...getStageData(['contacted']) },
    { 
      label: s.includes('interview') 
        ? (s.includes('1') || s.includes('1st') ? 'Interview Round 1' : s.includes('2') || s.includes('2nd') ? 'Interview Round 2' : s.includes('3') || s.includes('3rd') ? 'Interview Round 3' : s.replace(/\b\w/g, l => l.toUpperCase()))
        : 'Interview Round 1', 
      ...getStageData(['interview']),
      date: interviewedAt ? formatInterviewTime(interviewedAt) : getStageData(['interview']).date
    },
  ];

  let stages = [];
  let currentIndex = 0;

  if (isRejected || isSelected) {
    let lastValidIndex = 0;
    if (history && history.length > 0) {
      const prev = [...history].reverse().find(h => h.status !== 'rejected' && h.status !== 'selected');
      if (prev) {
        const ps = prev.status.toLowerCase();
        if (ps === 'reviewing') lastValidIndex = 1;
        else if (ps === 'contacted') lastValidIndex = 2;
        else if (ps.includes('interview')) lastValidIndex = 3;
      }
    }
    // Ensure at least "Reviewing" is shown if rejected early, as an application is inherently reviewed before being rejected.
    if (isRejected && lastValidIndex < 1) {
      lastValidIndex = 1;
    }

    stages = [
      ...baseStages.slice(0, lastValidIndex + 1),
      { 
        label: isRejected ? 'Not Selected This Time' : 'Selected', 
        ...getStageData([isRejected ? 'rejected' : 'selected']) 
      }
    ];
    currentIndex = stages.length - 1;
  } else {
    stages = baseStages;
    if (s === 'reviewing') currentIndex = 1;
    else if (s === 'contacted') currentIndex = 2;
    else if (s.includes('interview')) currentIndex = 3;
  }

  return (
    <div className="w-full overflow-x-auto pb-32 -mb-28 pt-8 -mt-6 z-10 relative">
      <div className="flex items-start w-fit min-w-full sm:min-w-0">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          let circleClasses = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-white border-2 border-[#E5E1DA]';
          let textColor = 'text-[#9CA3AF]';
          let icon = null;

          if (isCompleted) {
            circleClasses = `w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-[#00A693] border-[#00A693]`;
            textColor = 'text-[#1A1A1A] font-medium';
            icon = <Check size={16} className="text-white" strokeWidth={3} />;
          } else if (isCurrent) {
            circleClasses = `w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-white ${isRejected ? 'border-2 border-red-500' : 'border-4 border-[#00A693]'}`;
            textColor = isRejected ? 'text-red-600 font-medium' : 'text-[#1A1A1A] font-semibold';
          }

          if (isCurrent && isRejected) {
            icon = <X size={16} className="text-red-500" strokeWidth={3} />;
          }
          if (isCurrent && s === 'selected') {
            circleClasses = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors z-10 bg-[#00A693] border-[#00A693]';
            icon = <Check size={16} className="text-white" strokeWidth={3} />;
          }

          const isInterviewStage = stage.label.toLowerCase().includes('interview');
          const hasMeet = isInterviewStage && googleMeetLink;

          let circleElement = (
            <div className={circleClasses}>
              {icon}
            </div>
          );

          if (hasMeet) {
            circleClasses = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition bg-[#00A693] hover:bg-[#008f7e] text-white shadow hover:scale-105 cursor-pointer z-10`;
            icon = <Video size={14} />;
            circleElement = (
              <a
                href={googleMeetLink.startsWith('http') ? googleMeetLink : `https://${googleMeetLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className={circleClasses}
                title="Join Interview Meet"
              >
                {icon}
              </a>
            );
          }

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center relative w-16 group z-10 shrink-0">
                <div className="relative flex items-center justify-center h-8">
                  {circleElement}
                  {stage.note && !hasMeet && (
                    <span className="absolute -top-1.5 -right-2.5 group/tooltip z-50">
                      <Info size={14} className="text-[#6B7280] hover:text-[#1A1A1A] bg-white rounded-full cursor-help transition-colors shadow-sm" />
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white text-[#1A1A1A] text-[11px] font-medium leading-relaxed rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-left pointer-events-none z-[100] border border-[#E5E1DA]">
                        {stage.note}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#E5E1DA]"></span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-white mb-[-1px]"></span>
                      </span>
                    </span>
                  )}
                  {hasMeet && (
                    <span className="absolute -top-1.5 -right-3.5 group/tooltip z-50">
                      <div className="bg-white border border-[#E5E1DA] hover:bg-gray-50 text-gray-500 rounded-full p-0.5 shadow-sm cursor-pointer transition">
                        <Info size={10} className="text-[#486081]" />
                      </div>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white text-[#1A1A1A] text-[11px] font-medium leading-relaxed rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-left pointer-events-none z-[100] border border-[#E5E1DA]">
                        <ul className="space-y-1.5 text-[#4A4A4A]">
                          <li>• Join 5 minutes before scheduled time</li>
                          <li>• Attend using a laptop or PC</li>
                          <li>• Join from a quiet, private environment</li>
                          <li>• Keep your camera/webcam always on</li>
                          <li>• Ensure a stable internet connection</li>
                        </ul>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#E5E1DA]"></span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-white mb-[-1px]"></span>
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center mt-3 text-center leading-tight">
                  <span className={`text-xs whitespace-nowrap ${textColor}`}>
                    {stage.label}
                  </span>
                  {stage.date && (
                    <span className={`text-[10px] mt-1 whitespace-nowrap ${isCurrent ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                      {stage.date}
                    </span>
                  )}
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="w-16 sm:w-24 md:w-32 lg:w-40 shrink-0 flex items-center justify-center relative h-6 z-0">
                  {/* Solid line connecting the steps */}
                  <div className={`absolute left-0 right-0 h-1 -translate-y-1/2 top-1/2 ${isRejected && index === currentIndex - 1 ? 'bg-red-500' : 'bg-[#00A693]'}`}></div>
                  
                  {/* Chevron overlaid on the line */}
                  <div className={`bg-white relative z-10 flex items-center justify-center w-5 h-5 rounded-full border-2 ${isRejected && index === currentIndex - 1 ? 'border-red-500 text-red-500' : 'border-[#00A693] text-[#00A693]'}`}>
                    <ChevronRight 
                      size={14} 
                      strokeWidth={3} 
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

const formatInterviewTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${month} ${day}, ${hours}.${minStr} ${ampm}`;
};

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
      <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

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
                        {app.location?.toLowerCase() === 'remote' ? <Home size={14} /> : <MapPin size={14} />} {app.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <ApplicationStepper 
                status={app.applicantStatus} 
                history={app.statusHistory} 
                appliedAt={app.appliedAt} 
                googleMeetLink={app.googleMeetLink} 
                interviewedAt={app.interviewedAt} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
