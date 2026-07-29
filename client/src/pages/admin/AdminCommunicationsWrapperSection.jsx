import { useState } from 'react';
import AdminMessagesSection from './AdminMessagesSection';
import AdminEmailSection from './AdminEmailSection';
import AdminAnnouncementsSection from './AdminAnnouncementsSection';

export default function AdminCommunicationsWrapperSection({ onUnreadChange }) {
  const [tab, setTab] = useState('messages');

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-[50px] border-b border-[#E5E1DA]">
        <button
          onClick={() => setTab('messages')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'messages'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setTab('emails')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'emails'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Emails
        </button>
        <button
          onClick={() => setTab('announcements')}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            tab === 'announcements'
              ? 'border-[#0a7373] text-[#0a7373]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Announcements
        </button>
      </div>

      <div>
        {tab === 'messages' && <AdminMessagesSection onUnreadChange={onUnreadChange} />}
        {tab === 'emails' && <AdminEmailSection />}
        {tab === 'announcements' && <AdminAnnouncementsSection />}
      </div>
    </div>
  );
}
