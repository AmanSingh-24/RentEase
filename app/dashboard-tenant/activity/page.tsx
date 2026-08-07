"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, CheckCircle2, AlertTriangle, CreditCard, 
  Wrench, ArrowRight, Loader2
} from "lucide-react";
import Link from "next/link";

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryConfig: any = {
    payment: { icon: CreditCard, color: "#10B981" },
    maintenance: { icon: Wrench, color: "#0052CC" },
    urgent: { icon: AlertTriangle, color: "#EF4444" },
    nudge: { icon: AlertTriangle, color: "#EF4444" }, // Map nudge to urgent color
    system: { icon: Bell, color: "#6B7280" }
  };

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/activity/get`);
        const data = await res.json();
        if (res.ok) {
          // ✅ FIX: Catch 'urgent', 'alert' category and 'nudge' type for the red box
          setAlerts(data.activities.filter((a: any) => a.category === "urgent" || a.category === "alert" || a.type === "nudge"));
          setActivities(data.activities.filter((a: any) => a.category !== "urgent" && a.category !== "alert" && a.type !== "nudge"));
        }
      } catch (err) {
        console.error("Failed to load activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" size={40} /></div>;

  return (
    <div className="p-4 md:p-10 lg:p-12">
      <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F2937] tracking-tight">Activity & Alerts</h1>
          <p className="text-gray-400 font-medium mt-2">The digital paper trail of your property.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: URGENT ALERTS */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Priority Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-xs text-gray-300 font-bold uppercase p-6 border border-dashed rounded-3xl">Clean Slate</p>
          ) : (
            alerts.map((alert: any) => (
              <motion.div initial={{ x: -20 }} animate={{ x: 0 }} key={alert._id} className="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold mb-1 text-red-900 text-sm uppercase">{alert.title}</h3>
                <p className="text-xs leading-relaxed text-red-700/80 mb-6">{alert.desc || alert.message}</p>
                
                {/* ✅ QUICK ACTION BUTTON */}
                <Link href="/dashboard-tenant/payments" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-all uppercase tracking-widest">
                  Resolve Now <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: RECENT FEED */}
        <div className="lg:col-span-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Recent Activity</h2>
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <div className="space-y-10 relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-gray-50" />
              {activities.map((act: any, i) => {
                const config = 
  categoryConfig[act.type] || 
  categoryConfig[act.category] || 
  (act.type === 'nudge' ? categoryConfig.urgent : categoryConfig.system);
                return (
                  <motion.div key={act._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                      <config.icon size={18} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 border-b border-gray-50 pb-6">
                        <h4 className="text-sm font-bold text-[#1F2937]">{act.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{act.desc || act.message}</p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-2">{new Date(act.createdAt).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}