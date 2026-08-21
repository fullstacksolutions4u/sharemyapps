import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Crown } from 'lucide-react';
import { moduleAPI, progressAPI, feedbackAPI } from '../api/tick2test';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import TopicQuizModal from '../components/user/TopicQuizModal';
import _Lottie from 'lottie-react';
import modulesAnimation from '../assets/modules.json';
import { optimizeImage } from '../utils/image';
import { toast } from 'react-hot-toast';

const Lottie = _Lottie.default ?? _Lottie;

const LearningTracker = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedIndex = localStorage.getItem('lastModuleIndex');
    return savedIndex ? parseInt(savedIndex, 10) : 0;
  });
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loadingQuizTopicId, setLoadingQuizTopicId] = useState(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestTopicText, setSuggestTopicText] = useState('');
  const [suggestingModule, setSuggestingModule] = useState(null);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const sliderRef = useRef(null);
  const [dailyTarget] = useState(() => {
    const saved = localStorage.getItem('dailyTarget');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const completedModulesCount = useMemo(() => {
    return modules.filter(m => m.topics.length > 0 && m.topics.every(t => t.completed)).length;
  }, [modules]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchModulesAndProgress();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const refreshLeaderboard = async () => {
    try {
      const leaderRes = await progressAPI.getLeaderboard();
      if (leaderRes.data.success) {
        setLeaderboard(leaderRes.data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  };

  const handlePointsUpdate = (points) => {
    setUserPoints(prev => prev + points);
    const userId = user?._id?.toString?.() ?? user?.id?.toString?.();
    if (userId) {
      setLeaderboard(prev =>
        [...prev]
          .map(u =>
            (u.userId?.toString?.() ?? String(u.userId)) === userId
              ? { ...u, points: (u.points || 0) + points }
              : u
          )
          .sort((a, b) => b.points - a.points)
          .map((u, i) => ({ ...u, rank: i + 1 }))
      );
    }
    refreshLeaderboard();
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

        await refreshLeaderboard();
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
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }
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
              refreshLeaderboard();
              if (data.userStats.newBadges?.length > 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#C0C0C0', '#E5E4E2'] });
              }
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
            toast.error('Failed to update topic. Changes have been reverted.');
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
          toast.error('Failed to update topic. Please try again.');
        });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestTopicSubmit = async (e) => {
    e.preventDefault();
    if (!suggestTopicText.trim()) return;
    try {
      setIsSubmittingSuggestion(true);
      await feedbackAPI.create({
        message: `Suggested topic for module "${suggestingModule?.title || 'Unknown'}": ${suggestTopicText}`
      });
      setShowSuggestModal(false);
      setSuggestTopicText('');
      toast.success('Thank you! Your suggestion has been sent to the admin.');
    } catch {
      toast.error('Failed to send suggestion. Please try again.');
    } finally {
      setIsSubmittingSuggestion(false);
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



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: embedded ? '24px' : '24px', backgroundColor: '#F5F0E8' }}>
        <div className="text-center">
          <Lottie animationData={modulesAnimation} loop style={{ width: 400, height: 400, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: embedded ? '24px' : '24px', backgroundColor: '#F5F0E8' }}>
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
    <div className="min-h-screen relative" style={{ paddingTop: embedded ? '12px' : '12px', paddingBottom: '24px', background: 'linear-gradient(to bottom right, rgba(0,166,147,0.10), #ffffff, #f5f3ff)' }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="w-full px-1 xl:px-2">
        {modules.length === 0 ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
            <p className="text-lg font-semibold" style={{ color: '#1C1A17' }}>No modules available</p>
            <p className="text-sm mt-2" style={{ color: '#5A5550' }}>Modules will appear here once they are added by the admin</p>
          </div>
        ) : (
          <>
            {/* ── Compute 4-side splits ── */}
            {(() => {
              const mentorship = modules.filter(m => (m.order ?? 0) < 100);
              const additional = modules.filter(m => (m.order ?? 0) >= 100);
              const allModules = [...mentorship, ...additional];
              const halfCount = Math.ceil(allModules.length / 2);

              const leftMods   = allModules.slice(0, halfCount);
              const rightMods  = allModules.slice(halfCount);

              const mkGoldBtn = (module) => {
                const gi = modules.indexOf(module);
                const label = module.title.replace(/^Module\s+\d+\s*[:\s-]+\s*/i, '');
                const completedTopics = module.topics?.filter(t => t.completed).length || 0;
                const totalTopics = module.topics?.length || 0;
                const percent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
                
                const isActive = gi === currentIndex;
                const completedBg = isActive ? '#00A693' : '#D8CCF4';
                const uncompletedBg = isActive ? '#3ABCAE' : '#F3EEFF';
                const backgroundStyle = `linear-gradient(to right, ${completedBg} ${percent}%, ${uncompletedBg} ${percent}%)`;

                return (
                  <button key={gi} onClick={() => goToSlide(gi)} title={label}
                    className="whitespace-nowrap text-left transition-all duration-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between gap-2"
                    style={isActive
                      ? { background: backgroundStyle, color: '#FAF7F2', boxShadow: '0 2px 6px rgba(0,166,147,0.4)', border: '1px solid #008A7A' }
                      : { background: backgroundStyle, color: '#5A4080', border: '1px solid #C4B0E8' }}>
                    <span className="truncate flex-1 min-w-0">{gi + 1}. {label}</span>
                    {totalTopics > 0 && (
                      <span className="text-[10px] font-medium shrink-0 opacity-90 ml-1">
                        ({completedTopics}/{totalTopics})
                      </span>
                    )}
                  </button>
                );
              };

              const mkGoldSideBtn = (module) => {
                const gi = modules.indexOf(module);
                const label = module.title.replace(/^Module\s+\d+\s*[:\s-]+\s*/i, '');
                const completedTopics = module.topics?.filter(t => t.completed).length || 0;
                const totalTopics = module.topics?.length || 0;
                const percent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
                
                const isActive = gi === currentIndex;
                const completedBg = isActive ? '#00A693' : '#D8CCF4';
                const uncompletedBg = isActive ? '#3ABCAE' : '#F3EEFF';
                const backgroundStyle = `linear-gradient(to right, ${completedBg} ${percent}%, ${uncompletedBg} ${percent}%)`;

                return (
                  <button key={gi} onClick={() => goToSlide(gi)} title={label}
                    className="w-full whitespace-nowrap text-left transition-all duration-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between gap-2"
                    style={isActive
                      ? { background: backgroundStyle, color: '#FAF7F2', boxShadow: '0 2px 6px rgba(0,166,147,0.4)', border: '1px solid #008A7A' }
                      : { background: backgroundStyle, color: '#5A4080', border: '1px solid #C4B0E8' }}>
                    <span className="truncate flex-1 min-w-0">{gi + 1}. {label}</span>
                    {totalTopics > 0 && (
                      <span className="text-[10px] font-medium shrink-0 opacity-90 ml-1">
                        ({completedTopics}/{totalTopics})
                      </span>
                    )}
                  </button>
                );
              };

              return (
                <div className="flex flex-col gap-1 mb-4">


                  {/* ── MIDDLE ROW: left | cards | right ── */}
                  <div className="flex gap-1 items-stretch">

                    {/* LEFT column */}
                    <div className="hidden xl:flex flex-col gap-1 flex-shrink-0 w-[240px]">
                      {leftMods.map(mkGoldSideBtn)}
                    </div>

                    {/* CENTER: two main cards */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-2 items-stretch min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex-1 relative w-full">
                  <button onClick={goToPrevious} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 shadow-md" style={{ backgroundColor: '#FAF7F2', border: '2px solid #D4B896' }} aria-label="Previous module">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={goToNext} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 shadow-md" style={{ backgroundColor: '#FAF7F2', border: '2px solid #D4B896' }} aria-label="Next module">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div ref={sliderRef} className="overflow-x-auto overflow-y-hidden rounded-2xl" style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex" style={{ width: `${modules.length * 100}%` }}>
                      {modules.map((module, index) => {
                        const isModuleLocked = index >= 3 && !isAuthenticated;
                        const regularTopics = [...(module.topics || [])].filter(t => !t.isPracticalProblem).sort((a, b) => (a.order || 0) - (b.order || 0));

                        return (
                          <div key={module._id} className="flex-shrink-0" style={{ width: `${100 / modules.length}%`, minWidth: `${100 / modules.length}%`, scrollSnapAlign: 'start', scrollSnapStop: 'always', padding: '0 0.5rem' }}>
                            <div id={`module-container-${index}`} className="rounded-2xl shadow-lg p-3 border-2 flex flex-col relative" style={{ backgroundColor: '#FAF7F2', borderColor: isModuleLocked ? '#C07A3A' : index === currentIndex ? '#00A693' : '#E0D8CC', height: '800px' }}>
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
                               <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {regularTopics.map((topic, topicIndex) => {
                                      const uniqueAttempted = new Set((userProgress?.attemptedQuizzes || []).filter(a => String(a.topicId) === String(topic._id)).map(a => String(a.quizId)));
                                      const isQuizCompleted = topic.quizCount > 0 && uniqueAttempted.size >= topic.quizCount;
                                      const isPartial = uniqueAttempted.size > 0 && !isQuizCompleted;
                                      return (
                                        <div key={topic._id || topicIndex} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border group" style={{ backgroundColor: topic.completed ? '#EFF8EF' : isQuizCompleted ? '#F0ECFA' : '#F5F0E8', borderColor: topic.completed ? '#86efac' : isQuizCompleted ? '#C4B5FD' : '#00A693' }}>
                                          <button onClick={() => handleToggleTopic(module._id, topic._id, topic.completed, index)} className={`cursor-pointer flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${topic.completed ? 'bg-green-500 hover:bg-green-600 shadow-lg' : ''}`} style={!topic.completed ? { backgroundColor: '#FAF7F2', border: '1.5px solid #D4B896' } : {}} title={topic.completed ? 'Mark as incomplete' : 'Mark as complete'}>
                                            {topic.completed ? (
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C9A96E' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                          </button>
                                          <span className="flex-1 text-xs font-medium" style={{ color: topic.completed ? '#9A8A7A' : '#1C1A17' }}>{topic.name}</span>
                                          {(topic.hasQuiz || topic.quizzes?.length > 0 || topic.quiz?.question) && (
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!isAuthenticated) {
                                                  setShowLoginModal(true);
                                                  return;
                                                }
                                                if (!topic.completed || loadingQuizTopicId === topic._id) return;
                                                if (!topic.quizzes || topic.quizzes.length === 0) {
                                                  setLoadingQuizTopicId(topic._id);
                                                  try {
                                                    const res = await moduleAPI.getTopicQuizzes(module._id, topic._id);
                                                    if (res.data.success) {
                                                      setSelectedQuiz({ quizzes: res.data.data, moduleId: module._id, topicId: topic._id, topicName: topic.name });
                                                    }
                                                  } catch { toast.error('Failed to load quiz. Please try again.'); }
                                                  finally { setLoadingQuizTopicId(null); }
                                                } else {
                                                  setSelectedQuiz({ quizzes: topic.quizzes || [], moduleId: module._id, topicId: topic._id, topicName: topic.name });
                                                }
                                              }}
                                              disabled={!topic.completed || loadingQuizTopicId === topic._id}
                                              className="ml-2 px-2 py-1 text-xs font-semibold rounded-md transition-colors"
                                              style={isQuizCompleted ? { backgroundColor: '#22c55e', color: '#fff' } : isPartial ? { backgroundColor: '#f97316', color: '#fff' } : topic.completed ? { backgroundColor: '#9B7D43', color: '#FAF7F2' } : { backgroundColor: '#E0D8CC', color: '#5A5550', opacity: 0.7, cursor: 'not-allowed' }}
                                              title={isQuizCompleted ? 'All questions attempted' : isPartial ? `${uniqueAttempted.size}/${topic.quizCount} questions done — continue` : (topic.completed ? 'Take a quiz on this topic' : 'Tick the topic to start the quiz')}
                                            >
                                              {loadingQuizTopicId === topic._id ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                              ) : isQuizCompleted ? 'Completed' : isPartial ? 'Continue' : 'Start Quiz'}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    
                                    {regularTopics.length > 0 && (
                                      <div className="flex items-center justify-center p-2 mt-2">
                                        <button 
                                          onClick={() => {
                                            if (!isAuthenticated) {
                                              setShowLoginModal(true);
                                              return;
                                            }
                                            setSuggestingModule(module);
                                            setShowSuggestModal(true);
                                          }}
                                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-dashed transition-colors"
                                          style={{ color: '#9B7D43', borderColor: '#D4B896', backgroundColor: 'transparent' }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                          Suggest Missing Topic
                                        </button>
                                      </div>
                                    )}
                                  </div>

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
                <div className="flex-shrink-0 w-full lg:w-[360px] lg:sticky lg:top-28">
                  <div className="rounded-2xl shadow-xl p-3 flex flex-col overflow-y-auto custom-scrollbar" style={{ height: '800px', backgroundColor: '#FAF7F2', border: '2px solid #E0D8CC' }}>
                  
                  {/* Streak / Points / Completed Modules */}
                  <div className="flex flex-wrap items-center justify-center gap-1 mb-2 mt-1">
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: '#FFF8F0', border: '1px solid rgba(192,122,58,0.3)' }} title="Streak">
                      <span className="text-base animate-pulse">🔥</span>
                      <span className="text-xs font-bold text-[#1C1A17]">{streakCount}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: '#FFF8E8', border: '1px solid rgba(201,169,110,0.3)' }} title="Points">
                      <span className="text-[10px] font-bold uppercase text-[#9B7D43]">pts</span>
                      <span className="text-xs font-bold text-[#1C1A17]">{userPoints}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(34,197,94,0.3)' }} title="Completed Modules">
                      <span className="text-base">🎓</span>
                      <span className="text-xs font-bold text-[#1C1A17]">{completedModulesCount}/{modules.length}</span>
                    </div>
                  </div>



                  {/* Calendar */}
                  <div className="rounded-xl p-3 flex-shrink-0 mb-4 mx-auto w-full" style={{ backgroundColor: '#F0E8DC', border: '1px solid #D4B896' }}>
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="rounded-full p-1.5 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <h4 className="text-xs font-bold text-center" style={{ color: '#1C1A17' }}>{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                      <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="rounded-full p-1.5 shadow-sm" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C1A17' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const firstDay = new Date(year, month, 1).getDay();
                        const emptyCells = (firstDay + 6) % 7;
                        const actualToday = new Date();
                        const days = [];
                        for (let i = 0; i < emptyCells; i++) days.push(<div key={`e-${i}`} className="aspect-square"></div>);
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
                  </div>

                  {/* Leaderboard */}
                  <div className="flex-shrink-0 flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-2 mb-1 pl-1 text-[#9B7D43]">
                      <Trophy size={16} />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#5A5550]">Top Learners</h4>
                    </div>
                    {leaderboard.length === 0 ? (
                      <div className="text-center text-xs py-4 text-[#5A5550]">No data available</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {leaderboard.slice(0, 10).map((u, idx) => (
                          <Link 
                            key={u.userId} 
                            to={`/portfolio/${u.userId}`}
                            className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5"
                            style={{ backgroundColor: idx < 3 ? 'rgba(255,248,240,0.5)' : 'transparent', border: '1px solid rgba(212,184,150,0.3)' }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold"
                              style={{ 
                                backgroundColor: idx === 0 ? '#FEF08A' : idx === 1 ? '#E5E7EB' : idx === 2 ? '#FFEDD5' : 'transparent',
                                color: idx === 0 ? '#CA8A04' : idx === 1 ? '#4B5563' : idx === 2 ? '#C2410C' : '#9B7D43',
                                border: idx > 2 ? 'none' : '1px solid transparent'
                              }}>
                              {idx === 0 ? <Crown size={10} className="fill-[#CA8A04] text-[#CA8A04]" /> : idx + 1}
                            </div>
                            <img src={optimizeImage(u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`, 150)} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#1C1A17] truncate">{u.name}</p>
                            </div>
                            <span className="text-xs font-bold text-[#9B7D43]">{u.points} pts</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                   </div>
                      </div>
                      </div>

                    {/* RIGHT column */}
                    <div className="hidden xl:flex flex-col gap-1 flex-shrink-0 w-[240px]">
                      {rightMods.map(mkGoldSideBtn)}
                    </div>

                  </div>{/* end middle row */}

                  {/* ── BOTTOM ROW (Mobile Only) ── */}
                  <div className="xl:hidden flex flex-wrap justify-center gap-1.5 mt-2">
                    {leftMods.map(mkGoldBtn)}
                    {rightMods.map(mkGoldBtn)}
                  </div>

                </div>
              );
            })()}
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-100 shadow-lg">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>Login Required</h3>
              <p className="mb-6" style={{ color: '#5A5550' }}>Please log in or create an account to track your progress and play quizzes.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => navigate('/login')} className="flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-transform hover:scale-105" style={{ backgroundColor: '#1C1A17' }}>Log In</button>
                <button onClick={() => setShowLoginModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold transition-transform hover:scale-105" style={{ backgroundColor: 'transparent', color: '#1C1A17', border: '2px solid #D4B896' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Topic Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#FAF7F2', border: '1px solid #E0D8CC' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>Suggest Missing Topic</h3>
            <p className="text-sm mb-4" style={{ color: '#5A5550' }}>What topic is missing from the <strong>{suggestingModule?.title?.replace(/^Module\s+\d+\s*[:\s-]+\s*/i, '')}</strong> module?</p>
            <form onSubmit={handleSuggestTopicSubmit}>
              <textarea
                value={suggestTopicText}
                onChange={(e) => setSuggestTopicText(e.target.value)}
                placeholder="Type your suggestion here..."
                className="w-full rounded-lg p-3 mb-4 text-sm resize-none focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#FFF', border: '1px solid #E0D8CC', color: '#1C1A17', minHeight: '100px' }}
                required
              />
              <div className="flex gap-3 w-full">
                <button type="submit" disabled={isSubmittingSuggestion || !suggestTopicText.trim()} className="flex-1 px-4 py-2 text-white rounded-xl font-semibold transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" style={{ backgroundColor: '#9B7D43' }}>
                  {isSubmittingSuggestion ? 'Submitting...' : 'Submit'}
                </button>
                <button type="button" onClick={() => { setShowSuggestModal(false); setSuggestTopicText(''); }} className="flex-1 px-4 py-2 rounded-xl font-semibold transition-transform hover:scale-105" style={{ backgroundColor: 'transparent', color: '#1C1A17', border: '2px solid #D4B896' }}>Cancel</button>
              </div>
            </form>
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
          onBadgeEarned={() => {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#C0C0C0', '#E5E4E2'] });
          }}
          onPointsUpdate={handlePointsUpdate}
          onQuizAttempt={(attemptData) => {
            setUserProgress(prev => prev ? { ...prev, attemptedQuizzes: [...(prev.attemptedQuizzes || []), attemptData] } : prev);
          }}
        />
      )}
    </div>
  );
};

export default LearningTracker;
