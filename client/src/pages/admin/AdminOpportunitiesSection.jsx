import { useState, useRef } from 'react';
import { Briefcase, Laptop, Plus } from 'lucide-react';
import AdminVacanciesSection from './AdminVacanciesSection';
import AdminFreelanceSection from './AdminFreelanceSection';

const TABS = [
  { key: 'vacancies',  label: 'Vacancies',         icon: Briefcase },
  { key: 'reported',   label: 'Reported Vacancies', icon: Briefcase },
  { key: 'freelance',  label: 'Freelance Projects', icon: Laptop },
];

export default function AdminOpportunitiesSection({ stats }) {
  const [tab, setTab] = useState('vacancies');
  const vacanciesRef = useRef(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-[#E5E1DA]">
        <div className="flex gap-1">
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
              {key === 'reported' && stats?.pendingVacancies > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none shrink-0">
                  {stats.pendingVacancies}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'vacancies' && (
          <button
            onClick={() => vacanciesRef.current?.openAddVacancy()}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-xl transition-colors mb-1"
          >
            <Plus size={14} /> Add Vacancy
          </button>
        )}
      </div>

      {tab === 'vacancies'  && <AdminVacanciesSection ref={vacanciesRef} hideTitle filterStatus="standard" />}
      {tab === 'reported'   && <AdminVacanciesSection hideTitle filterStatus="reported" />}
      {tab === 'freelance'  && <AdminFreelanceSection />}
    </div>
  );
}
