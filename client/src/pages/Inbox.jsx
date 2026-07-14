import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Notifications from './Notifications';
import Messages from './Messages';
import Feedback from './Feedback';

export default function Inbox() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'notifications');
  const [prevLocationKey, setPrevLocationKey] = useState(location.key);

  if (location.key !== prevLocationKey) {
    setPrevLocationKey(location.key);
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Unified Tabs Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-2 py-3 overflow-x-auto custom-scrollbar">
          {['notifications', 'messages', 'feedback'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:bg-[#F3F0EB] hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1">
        {activeTab === 'notifications' && <Notifications />}
        {activeTab === 'messages' && <Messages />}
        {activeTab === 'feedback' && <Feedback />}
      </div>
    </div>
  );
}
