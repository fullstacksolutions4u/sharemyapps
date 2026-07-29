import { useState } from 'react';
import AdminOffersSection from './AdminOffersSection';
import AdminMentorshipApplicationsSection from './AdminMentorshipApplicationsSection';

export default function AdminApplicantsWrapperSection() {
  const [tab, setTab] = useState('placement');

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-[50px] border-b border-[#E5E1DA]">
        <button
          onClick={() => setTab('placement')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'placement'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Placement Applicants
        </button>
        <button
          onClick={() => setTab('mentorship')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'mentorship'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mentorship Applicants
        </button>
      </div>

      <div>
        {tab === 'placement' && <AdminOffersSection />}
        {tab === 'mentorship' && <AdminMentorshipApplicationsSection />}
      </div>
    </div>
  );
}
