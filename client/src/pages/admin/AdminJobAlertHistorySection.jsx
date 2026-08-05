import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminJobAlertHistorySection() {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.get('/admin/job-recommendations/history')
      .then(res => {
        const sessions = res.data.sessions || [];
        const grouped = {};

        [...sessions].reverse().forEach(session => {
          const d = new Date(session.scheduledAt || session.createdAt);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

          if (!grouped[dateStr]) grouped[dateStr] = [];

          session.recipients.forEach(user => {
            if (user.name === 'Amir Ali' || user.name === 'Tony Sunny') return;
            grouped[dateStr].push({
              userName: user.name,
              sessionNumber: session.sessionNumber,
              isScheduled: !session.notified,
            });
          });
        });

        setHistoryData(grouped);
      })
      .catch(() => toast.error('Failed to load job alert history'))
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ empty: false, day: d, dateStr, events: historyData[dateStr] || [], key: dateStr });
    }
    return cells;
  }, [currentDate, historyData, daysInMonth, firstDayOfMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) {
    return <div className="text-center py-10 text-sm text-[#9CA3AF]">Loading calendar...</div>;
  }

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth} 
            className="p-2 border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-2 border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[#E5E1DA] rounded-xl overflow-hidden border border-[#E5E1DA]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-[#F9FAFB] py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {day}
          </div>
        ))}

        {calendarCells.map(cell => (
          <div 
            key={cell.key} 
            className={`bg-white min-h-[120px] p-2 flex flex-col ${cell.empty ? 'bg-[#F9FAFB]' : ''}`}
          >
            {!cell.empty && (
              <>
                <span className={`text-xs font-medium mb-2 ${
                  cell.events.length > 0 ? 'text-[#00A693]' : 'text-[#9CA3AF]'
                }`}>
                  {cell.day}
                </span>
                <div className="flex-1 space-y-1.5 custom-scrollbar">
                  {cell.events.map((ev, i) => (
                    <div 
                      key={i} 
                      className={`px-2 py-1.5 border rounded-md text-[11px] leading-tight flex flex-col transition-colors ${
                        ev.isScheduled 
                          ? 'bg-amber-50 border-amber-200 hover:border-amber-400' 
                          : 'bg-[#F0FBF9] border-[#00A693]/20 hover:border-[#00A693]/40'
                      }`}
                    >
                      <span className={`font-semibold truncate ${ev.isScheduled ? 'text-amber-700' : 'text-[#00A693]'}`}>{ev.userName}</span>
                      <span className={`text-[10px] mt-0.5 ${ev.isScheduled ? 'text-amber-600/80' : 'text-[#6B7280]'}`}>Session {ev.sessionNumber}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
