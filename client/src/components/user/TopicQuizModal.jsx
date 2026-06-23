import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { progressAPI } from '../../api/tick2test';
import AnimatedCoin from '../common/AnimatedCoin';

const TopicQuizModal = ({
  isOpen,
  onClose,
  quizzes,
  moduleId,
  topicId,
  topicTitle,
  userAttempts = [],
  onBadgeEarned,
  onPointsUpdate,
  onQuizAttempt
}) => {
  const queryClient = useQueryClient();
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [localAttempts, setLocalAttempts] = useState(userAttempts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentQuizIndex(0);
      // eslint-disable-next-line react-hooks/immutability
      resetState(0);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    resetState(currentQuizIndex);
  }, [currentQuizIndex, localAttempts]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuiz = quizzes && quizzes[currentQuizIndex];

  const resetState = (index) => {
    if (!quizzes || !quizzes[index]) return;
    const quizId = quizzes[index]._id;
    const attempt = localAttempts.find(a => a.quizId.toString() === quizId.toString());
    if (attempt) {
      setSelectedOption(null);
      setIsCorrect(attempt.isCorrect);
      setShowExplanation(true);
    } else {
      setSelectedOption(null);
      setShowExplanation(false);
      setShowCode(false);
      setIsCorrect(false);
    }
  };

  if (!isOpen || !currentQuiz) return null;

  const handleOptionClick = async (index) => {
    if (showExplanation || isSubmitting) return;
    setSelectedOption(index);
    setIsSubmitting(true);
    const correct = index === currentQuiz.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    try {
      const response = await progressAPI.submitQuizAttempt({ moduleId, topicId, quizId: currentQuiz._id, isCorrect: correct });
      console.log('[Quiz] submitQuizAttempt response →', response.data);
      setLocalAttempts(prev => [...prev, { moduleId, topicId, quizId: currentQuiz._id, isCorrect: correct }]);
      if (onQuizAttempt) {
        onQuizAttempt({ moduleId, topicId, quizId: currentQuiz._id, isCorrect: correct, attemptedAt: new Date() });
      }
      if (correct && response.data?.data?.pointsAwarded) {
        console.log('[Quiz] points awarded →', response.data.data.pointsAwarded, '— invalidating leaderboard cache');
        setEarnedPoints(response.data.data.pointsAwarded);
        if (onPointsUpdate) onPointsUpdate(response.data.data.pointsAwarded);
        setTimeout(() => setEarnedPoints(null), 3000);
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      } else {
        console.log('[Quiz] no points awarded (correct=', correct, ', pointsAwarded=', response.data?.data?.pointsAwarded, ')');
      }
      if (response.data?.data?.newBadges?.length > 0 && onBadgeEarned) {
        onBadgeEarned(response.data.data.newBadges[0]);
      }
    } catch (error) {
      console.error('Failed to submit quiz attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setEarnedPoints(null);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    setEarnedPoints(null);
    if (currentQuizIndex > 0) setCurrentQuizIndex(prev => prev - 1);
  };

  const isLastQuestion = currentQuizIndex === quizzes.length - 1;

  const getOptionStyle = (index) => {
    const isUserSelected = index === selectedOption;
    const isCorrectAnswer = index === currentQuiz.correctAnswer;
    if (!showExplanation) return { backgroundColor: '#FAF7F2', borderColor: '#D4B896', color: '#1C1A17' };
    if (isCorrectAnswer) return { backgroundColor: '#EFF8EF', borderColor: '#22c55e', color: '#166534' };
    if (isUserSelected && !isCorrectAnswer) return { backgroundColor: '#FEF2F2', borderColor: '#ef4444', color: '#991b1b', opacity: 0.8 };
    return { backgroundColor: '#F5F0E8', borderColor: '#E0D8CC', color: '#5A5550', opacity: 0.7 };
  };

  const getLetterCircleStyle = (index) => {
    const isUserSelected = index === selectedOption;
    const isCorrectAnswer = index === currentQuiz.correctAnswer;
    if (!showExplanation) return { borderColor: '#D4B896', color: '#5A5550', backgroundColor: 'transparent' };
    if (isCorrectAnswer) return { backgroundColor: '#22c55e', borderColor: '#16a34a', color: '#fff' };
    if (isUserSelected && !isCorrectAnswer) return { backgroundColor: '#ef4444', borderColor: '#dc2626', color: '#fff' };
    return { borderColor: '#D4B896', color: '#C9A96E', backgroundColor: 'transparent' };
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(28,26,23,0.75)' }}>
      <div className="w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[600px] relative rounded-2xl" style={{ backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
        {/* Header */}
        <div className="p-6 flex justify-between items-center gap-4 min-h-[88px]" style={{ backgroundColor: '#F0E8DC', borderBottom: '1px solid #D4B896' }}>
          <div>
            <div className="flex items-center gap-3">
              {topicTitle && (
                <h3 className="text-xl font-bold hidden md:block" style={{ color: '#1C1A17', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {topicTitle}
                </h3>
              )}
              {earnedPoints && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl border shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(155,125,67,0.2))', borderColor: 'rgba(201,169,110,0.5)' }}>
                  <AnimatedCoin className="w-6 h-6" />
                  <span className="font-extrabold text-sm whitespace-nowrap" style={{ color: '#9B7D43' }}>+{earnedPoints}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#FAF7F2', color: '#9B7D43', border: '1px solid #D4B896' }}>
              {currentQuizIndex + 1} / {quizzes.length}
            </span>
            <button onClick={onClose} className="rounded-lg p-2 transition-colors" style={{ color: '#9A8A7A', backgroundColor: '#FAF7F2', border: '1px solid #D4B896' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9B7D43 #E0D8CC' }}>
          <div className="mb-5">
            <h4 className="text-base md:text-lg font-semibold leading-relaxed" style={{ color: '#1C1A17' }}>
              {currentQuiz.question}
            </h4>
            {currentQuiz.questionCode && (
              <div className="mt-3 mb-4 rounded-lg border p-3 font-mono text-xs md:text-sm overflow-x-auto shadow-inner" style={{ backgroundColor: '#1C1A17', borderColor: '#3A3530', color: '#D4B896' }}>
                <pre className="whitespace-pre-wrap">{currentQuiz.questionCode}</pre>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {currentQuiz.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showExplanation || isSubmitting}
                className="w-full py-3 px-4 rounded-lg border text-left transition-all duration-200 flex items-center justify-between"
                style={getOptionStyle(index)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors flex-shrink-0" style={getLetterCircleStyle(index)}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm md:text-base font-medium">{option}</span>
                </div>
                {showExplanation && index === currentQuiz.correctAnswer && (
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {showExplanation && index === selectedOption && index !== currentQuiz.correctAnswer && (
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation ? (
            <div className="mt-6 p-5 rounded-xl border" style={isCorrect ? { backgroundColor: '#EFF8EF', borderColor: '#86efac' } : { backgroundColor: '#FEF2F2', borderColor: '#fca5a5' }}>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg flex-shrink-0" style={isCorrect ? { backgroundColor: 'rgba(34,197,94,0.15)', color: '#16a34a' } : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#dc2626' }}>
                  {isCorrect ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold mb-1 text-base" style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>
                    {isCorrect ? 'Nicely done!' : 'Incorrect'}
                  </h5>
                  {!isCorrect && <p className="text-sm mb-2 font-medium" style={{ color: '#5A5550' }}>The correct answer is highlighted in green.</p>}
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: '#1C1A17' }}>
                    {currentQuiz.explanation || 'No explanation provided.'}
                  </p>
                  {currentQuiz.sampleCode && (
                    <div className="mt-4">
                      <button onClick={() => setShowCode(!showCode)} className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#9B7D43' }}>
                        <svg className={`w-5 h-5 transition-transform duration-300 ${showCode ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {showCode ? 'Hide Sample Code' : 'View Sample Code'}
                      </button>
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showCode ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="rounded-lg border p-4 font-mono text-xs md:text-sm overflow-x-auto shadow-inner relative group" style={{ backgroundColor: '#1C1A17', borderColor: '#3A3530', color: '#D4B896' }}>
                          <button onClick={() => navigator.clipboard.writeText(currentQuiz.sampleCode)} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: '#3A3530', color: '#9A8A7A' }} title="Copy code">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          <pre className="whitespace-pre-wrap">{currentQuiz.sampleCode}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-5 rounded-xl border min-h-[140px] flex items-center justify-center" style={{ borderColor: '#E0D8CC', backgroundColor: '#F5F0E8' }}>
              <p className="text-sm" style={{ color: '#C9A96E' }}>Select an answer above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-between items-center" style={{ backgroundColor: '#F0E8DC', borderTop: '1px solid #D4B896' }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuizIndex === 0}
            className="px-5 py-2 text-sm rounded-xl font-semibold transition-all"
            style={currentQuizIndex === 0
              ? { opacity: 0.4, cursor: 'not-allowed', backgroundColor: '#FAF7F2', color: '#9A8A7A', border: '1px solid #D4B896' }
              : { backgroundColor: '#FAF7F2', color: '#1C1A17', border: '1px solid #D4B896' }
            }
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 text-sm rounded-xl font-semibold transition-all shadow-md"
            style={{ backgroundColor: '#9B7D43', color: '#FAF7F2' }}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicQuizModal;
