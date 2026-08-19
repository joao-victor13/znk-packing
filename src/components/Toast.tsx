import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  action?: ToastAction;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border-emerald-800/80 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-800/80 shadow-rose-950/30'
              : 'bg-stone-900/95 text-stone-100 border-stone-700/80 shadow-stone-950/30'
          }`}
        >
          <div className="flex items-center space-x-2.5 mr-3 truncate">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-300 flex-shrink-0" />}
            <span className="truncate">{toast.message}</span>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{toast.action.label}</span>
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
