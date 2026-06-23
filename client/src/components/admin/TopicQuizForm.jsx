import { useState } from 'react';
import { ChevronDown, Trash2, Plus } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-border rounded-lg focus:ring-0 focus:border-accent bg-white text-text text-sm outline-none';

export default function TopicQuizForm({ quizzes, onChange }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const add = () => {
    onChange([...quizzes, { question: '', questionCode: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', sampleCode: '' }]);
    setExpandedIndex(quizzes.length);
  };

  const remove = (i) => {
    onChange(quizzes.filter((_, idx) => idx !== i));
    if (expandedIndex === i) setExpandedIndex(null);
  };

  const update = (i, field, value) => {
    const next = [...quizzes];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const updateOption = (qi, oi, value) => {
    const next = [...quizzes];
    const opts = [...next[qi].options];
    opts[oi] = value;
    next[qi] = { ...next[qi], options: opts };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-accent">Quiz Questions</p>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-accent-light text-accent rounded-lg hover:bg-accent/20 transition-colors border border-accent/20">
          <Plus size={11} /> Add Question
        </button>
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-4 bg-bg rounded-lg border border-border border-dashed">
          <p className="text-xs text-muted">No quiz questions yet.</p>
        </div>
      )}

      {quizzes.map((quiz, i) => (
        <div key={i} className="rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-2.5 flex items-center justify-between bg-white cursor-pointer hover:bg-bg transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <span className="text-sm text-text font-medium truncate max-w-[220px]">{quiz.question || 'New Question'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                <Trash2 size={13} />
              </button>
              <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${expandedIndex === i ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {expandedIndex === i && (
            <div className="p-4 space-y-3 border-t border-border bg-bg">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Question</label>
                <input type="text" value={quiz.question} onChange={e => update(i, 'question', e.target.value)}
                  className={inputCls} placeholder="Enter quiz question" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Question Code Snippet (optional)</label>
                <textarea value={quiz.questionCode || ''} onChange={e => update(i, 'questionCode', e.target.value)}
                  className={`${inputCls} font-mono min-h-[72px]`} placeholder="// optional code for the question..." />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted">Options (select correct answer)</label>
                {quiz.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${i}`} checked={quiz.correctAnswer === oi}
                      onChange={() => update(i, 'correctAnswer', oi)}
                      className="shrink-0 cursor-pointer accent-accent" />
                    <input type="text" value={opt} onChange={e => updateOption(i, oi, e.target.value)}
                      className={`flex-1 ${inputCls}`} placeholder={`Option ${oi + 1}`} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Explanation</label>
                <textarea value={quiz.explanation} onChange={e => update(i, 'explanation', e.target.value)}
                  className={`${inputCls} min-h-[72px]`} placeholder="Why is this answer correct?" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Sample Code (optional)</label>
                <textarea value={quiz.sampleCode || ''} onChange={e => update(i, 'sampleCode', e.target.value)}
                  className={`${inputCls} font-mono min-h-[88px]`} placeholder="// optional sample code..." />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
