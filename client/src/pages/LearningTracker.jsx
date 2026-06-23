import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleAPI, progressAPI, feedbackAPI } from '../api/tick2test';
import { useAuth } from '../context/AuthContext';
import AnimatedCoin from '../components/common/AnimatedCoin';
import PieChart from '../components/common/PieChart';
import confetti from 'canvas-confetti';
import TopicQuizModal from '../components/user/TopicQuizModal';

const LearningTracker = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedIndex = localStorage.getItem('lastModuleIndex');
    return savedIndex ? parseInt(savedIndex, 10) : 0;
  });
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loadingQuizTopicId, setLoadingQuizTopicId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await feedbackAPI.create({ message: feedbackText });
      setFeedbackSuccess(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const sliderRef = useRef(null);
  const [dailyTarget, setDailyTarget] = useState(() => {
    const saved = localStorage.getItem('dailyTarget');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchModulesAndProgress();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    if (userProgress) calculateWeeklyProgress();
  }, [userProgress, dailyTarget, weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('lastModuleIndex', currentIndex.toString());
  }, [currentIndex]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dailyProgressMap = useMemo(() => {
    const map = {};
    if (!userProgress?.completedTopics) return map;
    userProgress.completedTopics.forEach(topic => {
      if (!topic.completedAt) return;
      const dateStr = getLocalDateString(new Date(topic.completedAt));
      map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return map;
  }, [userProgress]);

  const calculateWeeklyProgress = () => {
    const actualToday = new Date();
    const viewDate = new Date();
    viewDate.setDate(viewDate.getDate() + (weekOffset * 7));
    const startOfWeek = new Date(viewDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const completedTopics = userProgress?.completedTopics || [];
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = getLocalDateString(d);
      const count = completedTopics.filter(topic => {
        if (!topic.completedAt) return false;
        return getLocalDateString(new Date(topic.completedAt)) === dateStr;
      }).length;
      weekData.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        fullDate: dateStr,
        completedCount: count,
        isToday: d.toDateString() === actualToday.toDateString()
      });
    }
    setWeeklyProgress(weekData);
  };

  useEffect(() => {
    localStorage.setItem('dailyTarget', dailyTarget.toString());
  }, [dailyTarget]);

  const triggerFireworks = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
      zIndex: 9999,
      disableForReducedMotion: true
    });
  };

  const fetchModulesAndProgress = async () => {
    try {
      setLoading(true);
      const modulesResponse = await moduleAPI.getAll();
      let progressResponse = { data: { success: false, progress: { completedTopics: [], completedModules: [] } } };
      if (isAuthenticated) {
        progressResponse = await progressAPI.getProgress();
      }
      const modulesData = modulesResponse.data;
      if (modulesData.success) {
        const fetchedModules = (modulesData.data || []).filter(module =>
          !module.title || !module.title.toLowerCase().includes('be ready')
        );
        const progressData = progressResponse.data;
        const progress = progressData.success ? progressData.progress : { completedTopics: [], completedModules: [] };
        setUserProgress(progress);
        if (progressData.userStats) {
          setUserPoints(progressData.userStats.points || 0);
        }
        const modulesWithProgress = fetchedModules.map(module => ({
          ...module,
          topics: module.topics.map(topic => ({
            ...topic,
            completed: progress.completedTopics.some(
              ct => ct.moduleId === module._id && ct.topicId === topic._id.toString()
            )
          }))
        }));
        setModules(modulesWithProgress);
      } else {
        setError('Failed to fetch modules');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch modules. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (moduleId, topicId, currentStatus, moduleIndex) => {
    try {
      if (moduleIndex >= 3 && !isAuthenticated) {
        return;
      }
      let allTopicsCompleted = false;
      setModules(prevModules =>
        prevModules.map(module => {
          if (module._id === moduleId) {
            const updatedTopics = module.topics.map(topic =>
              topic._id === topicId ? { ...topic, completed: !currentStatus } : topic
            );
            if (updatedTopics.filter(t => t.completed).length === updatedTopics.length && !currentStatus) {
              allTopicsCompleted = true;
            }
            return { ...module, topics: updatedTopics };
          }
          return module;
        })
      );
      if (allTopicsCompleted) setTimeout(() => triggerFireworks(`module-container-${moduleIndex}`), 300);

      progressAPI.toggleTopic(moduleId, topicId)
        .then(response => {
          const data = response.data;
          if (data.success) {
            setUserProgress(data.progress);
            if (data.userStats) {
              setUserPoints(data.userStats.points);
              if (data.userStats.newBadges?.length > 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#C0C0C0', '#E5E4E2'] });
              }
            }
            if (data.firstTopicMessage) {
              const toast = document.createElement('div');
              toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce border-2 border-orange-300';
              toast.style.maxWidth = '90%';
              toast.style.width = 'fit-content';
              toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">🎯</span><div><p class="font-bold text-sm">${data.firstTopicMessage}</p></div></div>`;
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.transition = 'opacity 0.5s';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 500);
              }, 15000);
            }
          } else {
            setModules(prevModules =>
              prevModules.map(module => {
                if (module._id === moduleId) {
                  return { ...module, topics: module.topics.map(topic => topic._id === topicId ? { ...topic, completed: currentStatus } : topic) };
                }
                return module;
              })
            );
            alert('Failed to update topic. Changes have been reverted.');
          }
        })
        .catch(err => {
          const errData = err.response?.data;
          if (errData?.dailyLimitExceeded) {
            setModules(prevModules =>
              prevModules.map(module => {
                if (module._id === moduleId) {
                  return { ...module, topics: module.topics.map(topic => topic._id === topicId ? { ...topic, completed: currentStatus } : topic) };
                }
                return module;
              })
            );
            setDailyLimitMessage(errData.limitMessage || 'Daily limit reached. Please try again tomorrow.');
            setShowDailyLimitModal(true);
            return;
          }
          setModules(prevModules =>
            prevModules.map(module => {
              if (module._id === moduleId) {
                return { ...module, topics: module.topics.map(topic => topic._id === topicId ? { ...topic, completed: currentStatus } : topic) };
              }
              return module;
            })
          );
          alert('Failed to update topic. Please try again.');
        });
    } catch (err) {
      console.error(err);
    }
  };

  const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? modules.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex(prev => (prev === modules.length - 1 ? 0 : prev + 1));
  const goToSlide = (index) => setCurrentIndex(index);

  useEffect(() => {
    if (sliderRef.current && modules.length > 0) {
      const container = sliderRef.current;
      container.scrollTo({ left: currentIndex * container.offsetWidth, behavior: 'smooth' });
    }
  }, [currentIndex, modules.length]);


  const overallProgress = useMemo(() => {
    if (modules.length === 0) return { completedModules: 0, totalModules: 0, percentage: 0 };
    const completedModules = modules.filter(m => {
      const total = m.topics?.length || 0;
      const completed = m.topics?.filter(t => t.completed).length || 0;
      return total > 0 && completed === total;
    }).length;
    const totalModules = modules.length;
    return { completedModules, totalModules, percentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0 };
  }, [modules]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: embedded ? '24px' : '100px', backgroundColor: '#F5F0E8' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#D4B896', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#5A5550' }}>Loading learning modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: embedded ? '24px' : '100px', backgroundColor: '#F5F0E8' }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchModulesAndProgress} className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: '#9B7D43' }}>Retry</button>
        </div>
      </div>
    );
  }

  const streakCount = (() => {
    if (!userProgress?.completedTopics) return 0;
    const uniqueDates = new Set();
    userProgress.completedTopics.forEach(topic => {
      if (!topic.completedAt) return;
      uniqueDates.add(getLocalDateString(new Date(topic.completedAt)));
    });
    const sortedDates = Array.from(uniqueDates).sort().reverse();
    if (!sortedDates.length) return 0;
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) return 0;
    let streak = 1;
    let current = new Date(sortedDates[0]);
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);
      if (sortedDates[i] === getLocalDateString(prev)) { streak++; current = prev; } else break;
    }
    return streak;
  })();

  return (
    <div className="min-h-screen" style={{ paddingTop: embedded ? '24px' : '100px', paddingBottom: '48px', backgroundColor: '#F5F0E8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Stats Panel */}
        <div className="mb-8 rounded-2xl p-6 backdrop-blur-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC', boxShadow: '0 4px 12px rgba(28,26,23,0.06)' }}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="text-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold inline-flex items-center gap-2" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Test Your Knowledge With A Tick
                  <span className="bg-green-500/20 text-green-400 p-1 rounded-full border border-green-500/50 shadow-sm">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </h2>
                <div className="flex flex-col items-center justify-center gap-3 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm" style={{ backgroundColor: '#FFF8F0', border: '1px solid rgba(192,122,58,0.3)' }}>
                      <span className="text-lg animate-pulse">🔥</span>
                      <span className="text-sm font-bold text-orange-400">Streak: <span style={{ color: '#1C1A17' }}>{streakCount} {streakCount === 1 ? 'day' : 'days'}</span></span>
                    </div>
                    <div className="px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm" style={{ backgroundColor: '#FFF8E8', border: '1px solid rgba(201,169,110,0.3)' }}>
                      <AnimatedCoin className="w-5 h-5" textSize="text-[8px]" />
                      <span className="text-sm font-bold text-yellow-400">Points: <span style={{ color: '#1C1A17' }}>{userPoints}</span></span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896' }}>
                      <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline" style={{ color: '#5A5550' }}>DAILY TARGET</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDailyTarget(Math.max(1, dailyTarget - 1))} className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ backgroundColor: '#9B7D43', color: '#FAF7F2' }}>-</button>
                        <span className="font-bold w-5 text-center text-sm" style={{ color: '#1C1A17' }}>{dailyTarget}</span>
                        <button onClick={() => setDailyTarget(Math.min(20, dailyTarget + 1))} disabled={dailyTarget >= 20} className="w-5 h-5 rounded flex items-center justify-center text-xs disabled:opacity-50" style={{ backgroundColor: '#FAF7F2', color: '#1C1A17', border: '1px solid #D4B896' }}>+</button>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline" style={{ color: '#5A5550' }}>TOPICS</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Weekly Progress */}
              <div className="relative px-10">
                <button onClick={() => setWeekOffset(prev => prev - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                  {weeklyProgress.map((day, idx) => {
                    const progress = Math.min(100, (day.completedCount / dailyTarget) * 100);
                    const isCompleted = day.completedCount >= dailyTarget;
                    const circumference = 2 * Math.PI * 15;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 min-w-[40px]">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="transparent" stroke="#E0D8CC" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="transparent" stroke={isCompleted ? '#22c55e' : '#f97316'} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} strokeLinecap="round" className="transition-all duration-500" />
                          </svg>
                          <div className="absolute inset-0 m-1 rounded-full flex items-center justify-center" style={{ backgroundColor: day.isToday ? 'rgba(155,125,67,0.15)' : 'transparent' }}>
                            <span className="text-xs font-bold" style={{ color: day.isToday ? '#9B7D43' : '#5A5550' }}>{day.date}</span>
                          </div>
                          {isCompleted && (
                            <div className="absolute -right-1 -top-1 bg-green-500 rounded-full p-0.5 shadow-lg border border-white">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: day.isToday ? '#9B7D43' : '#5A5550' }}>{day.dayName}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setWeekOffset(prev => prev + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            {/* Calendar */}
            <div className="w-full lg:w-64 rounded-xl p-3 flex flex-col relative group" style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold" style={{ color: '#1C1A17' }}>{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex gap-1.5 text-xs font-medium" style={{ color: '#5A5550' }}>
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E8DDD0' }}></div><span>0</span></div>
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D4B896' }}></div><span>&gt;0</span></div>
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span>Goal</span></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-xs font-bold" style={{ color: '#5A5550' }}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDay = new Date(year, month, 1).getDay();
                  const actualToday = new Date();
                  const days = [];
                  for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="aspect-square"></div>);
                  for (let i = 1; i <= daysInMonth; i++) {
                    const dateStr = getLocalDateString(new Date(year, month, i));
                    const count = dailyProgressMap[dateStr] || 0;
                    let bgClass = 'text-[#5A5550]';
                    let bgStyle = { backgroundColor: '#E8DDD0' };
                    if (count >= dailyTarget) { bgClass = 'text-white shadow-md'; bgStyle = { backgroundColor: '#9B7D43' }; }
                    else if (count > 0) { bgClass = 'text-[#6B4F2A]'; bgStyle = { backgroundColor: '#D4B896' }; }
                    const isToday = i === actualToday.getDate() && month === actualToday.getMonth() && year === actualToday.getFullYear();
                    days.push(
                      <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-xs font-semibold ${bgClass} ${isToday ? 'ring-2 ring-[#9B7D43] ring-offset-1 ring-offset-[#F0E8DC] z-10' : ''}`} style={bgStyle} title={`${count} topics completed`}>{i}</div>
                    );
                  }
                  return days;
                })()}
              </div>
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
            <p className="text-lg font-semibold" style={{ color: '#1C1A17' }}>No modules available</p>
            <p className="text-sm mt-2" style={{ color: '#5A5550' }}>Modules will appear here once they are added by the admin</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-center mb-8">
              <div className="flex-shrink-0 w-full lg:w-[700px]">
                <div className="flex-1 relative w-full">
                  <button onClick={goToPrevious} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 shadow-md" style={{ backgroundColor: '#FAF7F2', border: '2px solid #D4B896' }} aria-label="Previous module">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={goToNext} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 shadow-md" style={{ backgroundColor: '#FAF7F2', border: '2px solid #D4B896' }} aria-label="Next module">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div ref={sliderRef} className="overflow-x-auto overflow-y-hidden rounded-2xl" style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex" style={{ width: `${modules.length * 100}%` }}>
                      {modules.map((module, index) => {
                        const completedTopics = module.topics?.filter(t => t.completed).length || 0;
                        const totalTopics = module.topics?.length || 0;
                        const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
                        const isModuleLocked = index >= 3 && !isAuthenticated;
                        const regularTopics = [...(module.topics || [])].filter(t => !t.isPracticalProblem).sort((a, b) => (a.order || 0) - (b.order || 0));
                        const practicalProblems = [...(module.topics || [])].filter(t => t.isPracticalProblem).sort((a, b) => (a.order || 0) - (b.order || 0));
                        return (
                          <div key={module._id} className="flex-shrink-0" style={{ width: `${100 / modules.length}%`, minWidth: `${100 / modules.length}%`, scrollSnapAlign: 'start', scrollSnapStop: 'always', padding: '0 1rem' }}>
                            <div id={`module-container-${index}`} className="rounded-2xl shadow-lg p-6 border-2 flex flex-col relative" style={{ backgroundColor: '#FAF7F2', borderColor: isModuleLocked ? '#C07A3A' : '#E0D8CC', height: '800px' }}>
                              {isModuleLocked && (
                                <div className="absolute inset-0 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'rgba(245,240,232,0.85)' }}>
                                  <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C07A3A' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                  <h4 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>Module Locked</h4>
                                  <p className="text-center mb-6 max-w-md" style={{ color: '#5A5550' }}>Please sign up or log in to access Module {index + 1} and track your progress</p>
                                  <div className="flex gap-3">
                                    <button onClick={() => navigate('/login')} className="px-6 py-3 text-white rounded-lg font-semibold" style={{ backgroundColor: '#1C1A17' }}>Log In</button>
                                    <button onClick={() => navigate('/register')} className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: 'transparent', color: '#1C1A17', border: '2px solid #D4B896' }}>Sign Up</button>
                                  </div>
                                </div>
                              )}
                              <div className="mb-6 flex-shrink-0">
                                <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896' }}>
                                  <h3 className="text-xl font-bold text-center" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>
                                    <span style={{ color: '#9B7D43' }}>Module {index + 1} :</span> {module.title.replace(/^Module\s+\d+\s*[:\s-]+\s*/i, '')}
                                  </h3>
                                  {module.category && <p className="text-xs text-center mt-1 uppercase tracking-wider font-semibold" style={{ color: '#5A5550' }}>{module.category}</p>}
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col min-h-0">
                                <div className="mb-4 flex-shrink-0">
                                  <div className="flex items-center justify-between text-sm mb-3" style={{ color: '#5A5550' }}>
                                    <span className="font-semibold">Topics Progress</span>
                                    <span className="font-bold">{completedTopics} / {totalTopics} topics</span>
                                  </div>
                                  <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#E0D8CC' }}>
                                    <div className="rounded-full h-3 transition-all duration-500" style={{ background: 'linear-gradient(90deg, #9B7D43, #C9A96E)', width: `${progressPercentage}%` }}>
                                      {progressPercentage > 15 && <span className="text-xs font-bold text-white pr-1.5 flex items-center justify-end h-full">{Math.round(progressPercentage)}%</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="relative bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-2 border-amber-400 rounded-lg p-2.5 mb-4 flex items-center gap-2 flex-shrink-0 shadow-xl">
                                  <p className="text-amber-800 font-bold text-sm tracking-wide flex-1">✓ Tick each topic once you learn it thoroughly. Attend quiz to test your knowledge.</p>
                                </div>
                                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {regularTopics.map((topic, topicIndex) => {
                                      const uniqueAttempted = new Set((userProgress?.attemptedQuizzes || []).filter(a => String(a.topicId) === String(topic._id)).map(a => String(a.quizId)));
                                      const isQuizCompleted = topic.quizCount > 0 && uniqueAttempted.size >= topic.quizCount;
                                      return (
                                        <div key={topic._id || topicIndex} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border group" style={{ backgroundColor: topic.completed ? '#EFF8EF' : isQuizCompleted ? '#F0ECFA' : '#F5F0E8', borderColor: topic.completed ? '#86efac' : isQuizCompleted ? '#C4B5FD' : '#D4B896' }}>
                                          <button onClick={() => handleToggleTopic(module._id, topic._id, topic.completed, index)} className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${topic.completed ? 'bg-green-500 hover:bg-green-600 shadow-lg' : ''}`} style={!topic.completed ? { backgroundColor: '#FAF7F2', border: '1.5px solid #D4B896' } : {}} title={topic.completed ? 'Mark as incomplete' : 'Mark as complete'}>
                                            {topic.completed ? (
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C9A96E' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                          </button>
                                          <span className="flex-1 text-sm font-medium" style={{ color: topic.completed ? '#9A8A7A' : '#1C1A17', textDecoration: topic.completed ? 'line-through' : 'none' }}>{topic.name}</span>
                                          {(topic.hasQuiz || topic.quizzes?.length > 0 || topic.quiz?.question) && (
                                            <button
                                              onClick={async (e) => {
                                                if (!topic.completed || loadingQuizTopicId === topic._id) return;
                                                e.stopPropagation();
                                                if (!topic.quizzes || topic.quizzes.length === 0) {
                                                  setLoadingQuizTopicId(topic._id);
                                                  try {
                                                    const res = await moduleAPI.getTopicQuizzes(module._id, topic._id);
                                                    if (res.data.success) {
                                                      setSelectedQuiz({ quizzes: res.data.data, moduleId: module._id, topicId: topic._id, topicName: topic.name });
                                                    }
                                                  } catch { alert('Failed to load quiz. Please try again.'); }
                                                  finally { setLoadingQuizTopicId(null); }
                                                } else {
                                                  setSelectedQuiz({ quizzes: topic.quizzes || [], moduleId: module._id, topicId: topic._id, topicName: topic.name });
                                                }
                                              }}
                                              disabled={!topic.completed || loadingQuizTopicId === topic._id}
                                              className="ml-2 px-2 py-1 text-xs font-semibold rounded-md transition-colors"
                                              style={isQuizCompleted ? { backgroundColor: '#22c55e', color: '#fff' } : topic.completed ? { backgroundColor: '#9B7D43', color: '#FAF7F2' } : { backgroundColor: '#E0D8CC', color: '#5A5550', opacity: 0.7, cursor: 'not-allowed' }}
                                              title={isQuizCompleted ? 'All questions attempted' : (topic.completed ? 'Take a quiz on this topic' : 'Complete the topic to unlock quiz')}
                                            >
                                              {loadingQuizTopicId === topic._id ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                              ) : 'Start Quiz'}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {practicalProblems.length > 0 && (
                                    <div className="mt-3 flex-shrink-0 rounded-xl p-3 shadow-inner" style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896' }}>
                                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2 mb-3 px-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                        LeetCode Problems
                                      </h4>
                                      <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                                        {practicalProblems.map((topic, tIdx) => (
                                          <div key={topic._id || `pp-${tIdx}`} className="flex items-center gap-3 p-2 rounded-lg border" style={{ backgroundColor: topic.completed ? '#EFF8EF' : '#FAF7F2', borderColor: topic.completed ? '#86efac' : '#D4B896' }}>
                                            <button onClick={() => handleToggleTopic(module._id, topic._id, topic.completed, index)} className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={topic.completed ? { backgroundColor: '#C9A96E' } : { border: '1.5px solid #D4B896', backgroundColor: 'transparent' }}>
                                              {topic.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                              <span className="text-sm font-medium truncate" style={{ color: topic.completed ? '#9A8A7A' : '#1C1A17', textDecoration: topic.completed ? 'line-through' : 'none' }}>{topic.name}</span>
                                              {topic.problemUrl && (
                                                <a href={topic.problemUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold" style={topic.completed ? { backgroundColor: '#E0D8CC', color: '#5A5550' } : { backgroundColor: 'rgba(201,169,110,0.15)', color: '#9B7D43', border: '1px solid rgba(201,169,110,0.5)' }}>
                                                  <span>Solve</span>
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {/* Progress Panel */}
              <div className="flex-shrink-0 w-full lg:w-[400px] lg:sticky lg:top-32">
                <div className="rounded-2xl shadow-xl p-6 flex flex-col" style={{ height: '800px', backgroundColor: '#FAF7F2', border: '2px solid #E0D8CC' }}>
                  <h3 className="text-lg font-bold mb-4 text-center" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>Module Progress</h3>
                  <div className="flex flex-col items-center justify-center flex-1">
                    <PieChart percentage={overallProgress.percentage} size={200} strokeWidth={20} color="#9B7D43" backgroundColor="#E0D8CC" showPercentage={true}>
                      <span className="text-sm mt-2 font-medium text-center" style={{ color: '#5A5550' }}>{overallProgress.completedModules} / {overallProgress.totalModules} Modules</span>
                    </PieChart>
                    <p className="text-xs mt-4 text-center max-w-[200px]" style={{ color: '#5A5550' }}>Complete all topics in a module to mark it as finished</p>
                    <div className="mt-4 pt-4 w-full" style={{ borderTop: '1px solid #E0D8CC' }}>
                      <div className="text-center">
                        <p className="text-sm mb-1 font-medium" style={{ color: '#5A5550' }}>Total Topics Completed</p>
                        <p className="text-2xl font-bold" style={{ color: '#9B7D43' }}>
                          {modules.reduce((total, m) => total + (m.topics?.filter(t => t.completed).length || 0), 0)}
                          <span className="text-lg" style={{ color: '#5A5550' }}> / </span>
                          {modules.reduce((total, m) => total + (m.topics?.length || 0), 0)}
                        </p>
                        <p className="text-xs mt-1 font-medium" style={{ color: '#5A5550' }}>topics in all modules</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Module navigation dots */}
        {modules.length > 0 && (
          <>
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full px-2">
                {modules.map((_, index) => (
                  <button key={index} onClick={() => goToSlide(index)} className="flex-shrink-0 transition-all duration-300 rounded-full flex items-center justify-center font-bold text-xs w-7 h-7"
                    style={index === currentIndex ? { backgroundColor: '#9B7D43', color: '#FAF7F2', boxShadow: '0 2px 8px rgba(155,125,67,0.4)', border: '1px solid #C9A96E' } : { backgroundColor: '#FAF7F2', color: '#5A5550', border: '1px solid #D4B896' }}
                    aria-label={`Go to module ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="text-center mt-4 font-semibold" style={{ color: '#5A5550' }}>Module {currentIndex + 1} of {modules.length}</div>
            </div>

            {/* Feedback */}
            <div className="max-w-4xl mx-auto mt-12 mb-8 px-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-2 font-medium whitespace-nowrap" style={{ color: '#5A5550' }}>
                    <span className="text-lg">💬</span>
                    <span>Let us know feedback and missing topics to add</span>
                  </div>
                  {feedbackSuccess ? (
                    <div className="flex-1 text-center text-green-600 text-sm font-semibold">Thank you! Feedback received. ✅</div>
                  ) : (
                    <div className="flex-1 w-full flex items-center gap-3">
                      <input
                        type="text"
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7D43] transition-colors placeholder-[#9A8A7A]"
                        style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896', color: '#1C1A17' }}
                        disabled={isSubmittingFeedback || !isAuthenticated}
                        onKeyDown={e => e.key === 'Enter' && handleFeedbackSubmit()}
                      />
                      <button onClick={handleFeedbackSubmit} disabled={!feedbackText.trim() || isSubmittingFeedback || !isAuthenticated} className="px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" style={{ backgroundColor: '#9B7D43', color: '#FAF7F2' }}>
                        {isSubmittingFeedback ? '...' : 'Submit'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .overflow-x-auto::-webkit-scrollbar { display: none; }
        .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #E0D8CC; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #9B7D43; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #9B7D43 #E0D8CC; }
      `}</style>

      {/* Daily Limit Modal */}
      {showDailyLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
                <span className="text-4xl">⏸️</span>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>Daily Limit Reached!</h3>
              <div className="mb-6 space-y-3 text-left w-full" style={{ color: '#5A5550' }}>
                {dailyLimitMessage.split('\n\n').map((para, idx) => <p key={idx} className="leading-relaxed">{para}</p>)}
              </div>
              <button onClick={() => setShowDailyLimitModal(false)} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold">Got it! 💪</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {selectedQuiz && (
        <TopicQuizModal
          isOpen={!!selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
          quizzes={selectedQuiz.quizzes}
          moduleId={selectedQuiz.moduleId}
          topicId={selectedQuiz.topicId}
          topicTitle={selectedQuiz.topicName}
          userAttempts={userProgress?.attemptedQuizzes || []}
          onBadgeEarned={(badge) => {
            setNewBadgeDetails(badge);
            setShowBadgeModal(true);
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#C0C0C0', '#E5E4E2'] });
          }}
          onPointsUpdate={(points) => setUserPoints(prev => prev + points)}
          onQuizAttempt={(attemptData) => {
            setUserProgress(prev => prev ? { ...prev, attemptedQuizzes: [...(prev.attemptedQuizzes || []), attemptData] } : prev);
          }}
        />
      )}
    </div>
  );
};

export default LearningTracker;
