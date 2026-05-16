"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Settings, User, Lock, CreditCard, Clock, ShieldCheck, 
  Trash2, HelpCircle, ChevronRight, MessageSquare, Wrench, 
  CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";

export default function OwnerSettings() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalActivity = async () => {
      try {
        const res = await fetch(`/api/activity/get`);
        const data = await res.json();
        if (res.ok) setActivities(data.activities);
      } catch (err) {
        console.error("Failed to load global feed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalActivity();
  }, []);

  const getCategoryColor = (cat: string) => {
    const colors: any = { 
      payment: "#10B981", 
      maintenance: "#F59E0B", 
      legal: "#0D9488",
      system: "#0052CC" 
    };
    return colors[cat] || "#0052CC";
  };

  return (
    <div className="p-4 md:p-10 lg:p-12">
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1F2937] tracking-tight">System Settings & Activity</h1>
        <p className="text-gray-400 font-medium mt-2">Manage your global preferences and portfolio-wide audit log.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: LIVE GLOBAL ACTIVITY FEED */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#1F2937]">Global Activity Feed</h3>
              {loading && <Loader2 className="animate-spin text-gray-300" size={18} />}
            </div>
            
            <div className="space-y-10 relative min-h-[200px]">
              <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-gray-50" />
              
              {activities.length === 0 && !loading ? (
                <p className="text-sm text-gray-400 font-bold text-center py-10 uppercase tracking-widest">No portfolio activity yet.</p>
              ) : (
                activities.map((act: any, i) => (
                  <motion.div 
                    key={act._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-6 relative z-10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(act.category) }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-[#1F2937]">{act.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">
                          {act.desc}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-300 uppercase shrink-0">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* PROPERTY MANAGEMENT CONFIG */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
             <h3 className="text-xl font-bold text-[#1F2937] mb-8">Property Management Config</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Rent Reminder Schedule", desc: "Auto-notify 3 days before due date", icon: Clock },
                  { label: "Contractor Directory", desc: "Manage plumbers and electricians", icon: Wrench },
                  { label: "Auto-Response Templates", desc: "Pre-filled messages for common issues", icon: MessageSquare },
                  { label: "Agreement Expiry Alerts", desc: "Notify 60 days before lease ends", icon: AlertCircle },
                ].map((item, i) => (
                  <button key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-50 hover:border-[#0052CC]/20 hover:bg-blue-50/30 transition-all text-left group">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                      <item.icon size={20} className="text-[#1F2937]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{item.label}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACCOUNT & HELP */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#1F2937] mb-6">Account & Security</h3>
            <div className="space-y-1">
              {[
                { icon: User, label: "Profile Information" },
                { icon: Lock, label: "Security & Password" },
                { icon: CreditCard, label: "Payment Details" },
                { icon: Bell, label: "Notifications" },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all group">
                   <div className="flex items-center gap-4 text-gray-500 group-hover:text-[#1F2937] transition-colors">
                      <item.icon size={18} />
                      <span className="text-sm font-bold">{item.label}</span>
                   </div>
                   <ChevronRight size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1F2937] rounded-[32px] p-8 text-white shadow-2xl">
             <HelpCircle size={32} className="text-[#0D9488] mb-6 opacity-50" />
             <h3 className="text-xl font-bold mb-2">Owner Support</h3>
             <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Need guidance on handling a security deposit dispute or understanding your legal obligations?
             </p>
             <button className="w-full py-4 bg-[#0052CC] text-white rounded-2xl font-bold text-xs hover:bg-[#0041a3] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                Contact Legal Support
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}