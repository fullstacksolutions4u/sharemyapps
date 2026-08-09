import { useState } from 'react';
import AdminPremiumServicesSection from './AdminPremiumServicesSection';
import AdminJobRecommendationsSection from './AdminJobRecommendationsSection';
import AdminJobAlertHistorySection from './AdminJobAlertHistorySection';
import AdminApplicantStatusesSection from './AdminApplicantStatusesSection';

export default function AdminServicesWrapperSection() {
  const [tab, setTab] = useState('send_alert');

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-[50px] border-b border-[#E5E1DA]">
        <button
          onClick={() => setTab('send_alert')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'send_alert'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Send Job Alert
        </button>
        <button
          onClick={() => setTab('alert_history')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'alert_history'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Job Alert Calender
        </button>
        <button
          onClick={() => setTab('applicant_status')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'applicant_status'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Applicant Status
        </button>
        <button
          onClick={() => setTab('premium')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'premium'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Premium Services
        </button>
      </div>

      <div>
        {tab === 'send_alert' && <AdminJobRecommendationsSection />}
        {tab === 'alert_history' && <AdminJobAlertHistorySection />}
        {tab === 'applicant_status' && <AdminApplicantStatusesSection />}
        {tab === 'premium' && <AdminPremiumServicesSection />}
      </div>
    </div>
  );
}
