"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// ── Single Toast Item ─────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
};

const BORDER: Record<ToastType, string> = {
  success: "border-l-emerald-400",
  error: "border-l-red-400",
  info: "border-l-blue-400",
  warning: "border-l-amber-400",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<any>(null);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 border-l-4 ${BORDER[toast.type]} px-4 py-3.5 max-w-sm w-full pointer-events-auto`}
    >
      {ICONS[toast.type]}
      <p className="text-sm font-medium text-[#1F2937] flex-1 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Stack — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
