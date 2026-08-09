import { useState } from 'react';
import AdminJobRecommendationsSection from './AdminJobRecommendationsSection';
import AdminJobAlertHistorySection from './AdminJobAlertHistorySection';

export default function AdminJobAlertsWrapperSection() {
  const [tab, setTab] = useState('send');

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-[50px] border-b border-[#E5E1DA]">
        <button
          onClick={() => setTab('send')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'send'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Send Job Alert
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'history'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Job Alert Calender
        </button>
      </div>

      <div>
        {tab === 'send' && <AdminJobRecommendationsSection />}
        {tab === 'history' && <AdminJobAlertHistorySection />}
      </div>
    </div>
  );
}
