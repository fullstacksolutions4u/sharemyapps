import { useState } from 'react';
import { Briefcase, Laptop, GraduationCap } from 'lucide-react';
import AdminVacanciesSection from './AdminVacanciesSection';
import AdminFreelanceSection from './AdminFreelanceSection';
import AdminMentorshipSection from './AdminMentorshipSection';

const TABS = [
  { key: 'vacancies',  label: 'Vacancies',         icon: Briefcase },
  { key: 'freelance',  label: 'Freelance Projects', icon: Laptop },
  { key: 'mentorship', label: 'Mentorship',         icon: GraduationCap },
];

export default function AdminOpportunitiesSection() {
  const [tab, setTab] = useState('vacancies');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Opportunities</h2>
      </div>

      <div className="flex gap-1 border-b border-[#E5E1DA]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-[#00A693] text-[#00A693]'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB] rounded-t-lg'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'vacancies'  && <AdminVacanciesSection hideTitle />}
      {tab === 'freelance'  && <AdminFreelanceSection />}
      {tab === 'mentorship' && <AdminMentorshipSection />}
    </div>
  );
}
