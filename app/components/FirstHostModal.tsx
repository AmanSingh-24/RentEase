"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, X, ArrowRight, Sparkles, ShieldCheck, FileText, Rocket } from "lucide-react";

interface FirstHostModalProps {
  userName: string;
  onDismiss: () => void;
}

export default function FirstHostModal({ userName, onDismiss }: FirstHostModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleGoToDashboard = async () => {
    await fetch("/api/notifications/dismiss-first-login", { method: "POST" });
    onDismiss();
    window.location.href = "/dashboard-owner";
  };

  const handleDismiss = async () => {
    await fetch("/api/notifications/dismiss-first-login", { method: "POST" });
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[9991] flex items-center justify-center p-4 text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-neutral-200">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-5 right-5 w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-all z-10"
                title="Close"
              >
                <X size={16} />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center pt-2">
                {/* Sleek icon badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                  className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-neutral-900/10"
                >
                  <ShieldCheck size={32} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h2 className="text-2xl font-extrabold text-neutral-950 mb-1">
                    Welcome Host, {userName.split(" ")[0]}!
                  </h2>
                  <p className="text-neutral-600 font-bold text-xs mb-4 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={14} className="text-neutral-900" /> Verified RentEase Host Account
                  </p>
                  <p className="text-neutral-500 text-xs leading-relaxed mb-6">
                    Your host application has been officially approved. Your property listing is undergoing final marketplace checks and will go live shortly.
                  </p>
                </motion.div>

                {/* Status Timeline List */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-left mb-6 space-y-3"
                >
                  {[
                    { icon: CheckCircle, text: "Identity & KYC verified by RentEase" },
                    { icon: FileText, text: "Property listing under marketplace audit" },
                    { icon: Rocket, text: "Go live & start receiving booking applications" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 flex-shrink-0">
                        <item.icon size={14} />
                      </div>
                      <span className="text-xs font-semibold text-neutral-700">{item.text}</span>
                    </div>
                  ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-3.5 border border-neutral-200 rounded-xl font-bold text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleGoToDashboard}
                    className="flex-1 py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    Host Dashboard <ArrowRight size={14} />
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
