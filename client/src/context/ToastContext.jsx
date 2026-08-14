import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  info: { style: 'bg-slate-800', Icon: Info },
  success: { style: 'bg-emerald-600', Icon: CheckCircle2 },
  error: { style: 'bg-red-600', Icon: XCircle },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const { style, Icon } = VARIANTS[t.type] || VARIANTS.info;
          return (
            <div
              key={t.id}
              role="alert"
              className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${style}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
