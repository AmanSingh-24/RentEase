"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, X, ArrowRight, Sparkles } from "lucide-react";

interface FirstHostModalProps {
  userName: string;
  onDismiss: () => void;
}

export default function FirstHostModal({ userName, onDismiss }: FirstHostModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Slight delay so page finishes loading before modal pops
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleGoToDashboard = async () => {
    // Clear the flag on the server so this modal never shows again
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-60" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-50 rounded-full opacity-60" />

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all z-10"
              >
                <X size={16} />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Animated celebration icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -10, 10, -5, 0] }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeInOut" }}
                  className="w-20 h-20 bg-gradient-to-br from-[#0052CC] to-[#0041a3] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-200"
                >
                  <span className="text-4xl">🎉</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2 className="text-2xl font-black text-[#1F2937] mb-1">
                    Congratulations, {userName.split(" ")[0]}!
                  </h2>
                  <p className="text-[#0052CC] font-bold text-sm mb-4 flex items-center justify-center gap-1">
                    <Sparkles size={14} /> You're now a verified RentEase Host
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Your host application has been approved. Your property listing is being reviewed for the marketplace and will go live soon.
                  </p>
                </motion.div>

                {/* What's next */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-3"
                >
                  {[
                    { icon: "✅", text: "Identity verified by RentEase" },
                    { icon: "📋", text: "Property listing under marketplace review" },
                    { icon: "🚀", text: "Go live & start receiving tenant applications" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-600">{item.text}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-3.5 border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Maybe later
                  </button>
                  <button
                    onClick={handleGoToDashboard}
                    className="flex-1 py-3.5 bg-[#0052CC] text-white rounded-2xl font-black text-sm hover:bg-[#0041a3] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    Host Dashboard <ArrowRight size={16} />
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
