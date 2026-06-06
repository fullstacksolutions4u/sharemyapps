import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in"
        style={{ animation: 'confirmSlideIn 0.18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          {danger
            ? <Trash2 size={22} className="text-red-500" />
            : <AlertTriangle size={22} className="text-amber-500" />
          }
        </div>

        {/* Text */}
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">{title}</h2>
        {message && <p className="text-sm text-[#6B7280] leading-relaxed">{message}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E5E1DA] text-[#374151] hover:bg-[#F3F0EB] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}
