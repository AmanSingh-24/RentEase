"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, CheckCircle2, History, PlusCircle, 
  Home, FileText, Download, ShieldCheck, Zap, Clock, ArrowRight, ShieldAlert
} from "lucide-react";
import Link from "next/link";

export default function TenantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current authenticated user from session
        const meRes = await fetch(`/api/auth/me`);
        if (!meRes.ok) throw new Error("Failed to fetch user session");
        const meData = await meRes.json();
        setUser(meData.user);

        // Fetch active property if exists
        if (meData.user.propertyId) {
          const propRes = await fetch(`/api/properties/tenant-view`);
          const propData = await propRes.json();
          setProperty(propData.property);

          const insRes = await fetch(`/api/inspections/get?type=move-in`);
          const insData = await insRes.json();
          if (insRes.ok) setInspection(insData.inspection);
        }

        // Fetch history regardless of active property status
        const historyRes = await fetch(`/api/exit/get-history`);
        const historyData = await historyRes.json();
        if (historyRes.ok) setHistory(historyData.history);

      } catch (err) { console.error("Dashboard Sync Error:", err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#F9FAFB]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Your Vault...</p>
    </div>
  );

  // 🚪 CASE A: RETURNER / ARCHIVED USER (No active propertyId)
  if (!user?.propertyId) {
    const isReturningUser = history.length > 0;

    return (
      <div className="p-8 md:p-16 max-w-6xl mx-auto space-y-16">
        {/* WELCOME HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-6xl font-black text-[#1F2937] tracking-tighter">
              {isReturningUser ? `Welcome back, ${user?.name.split(" ")[0]}!` : "Welcome Home"}
            </h1>
            <p className="text-gray-400 mt-3 text-lg font-medium">
              {isReturningUser 
                ? "Your digital residency history is secured below." 
                : "Enter an invite code to link your first property."}
            </p>
          </motion.div>
          
          <Link href="/onboarding/invite-code">
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="px-10 py-5 bg-[#0052CC] text-white rounded-[32px] font-bold flex items-center gap-3 shadow-2xl shadow-blue-500/30 transition-all"
            >
              <PlusCircle size={22}/> Join New Property
            </motion.button>
          </Link>
        </header>

        {/* FEATURED: JOIN PROPERTY (If no history) */}
        {!isReturningUser && (
          <section className="bg-white border-2 border-dashed border-gray-100 rounded-[64px] p-24 text-center">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
               <Home size={48} />
             </div>
             <h3 className="text-3xl font-black text-[#1F2937]">No Active Residency</h3>
             <p className="text-gray-400 mt-4 max-w-md mx-auto leading-relaxed text-lg">
               You haven't linked a property yet. Use the invite code provided by your owner to start your condition audit.
             </p>
          </section>
        )}

        {/* 📜 THE LEGACY VAULT: RESIDENCY HISTORY */}
        {isReturningUser && (
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <History size={24}/>
              </div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">Residency Legacy Vault</h3>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {history.map((record: any, idx: number) => (
                <motion.div 
                  key={record._id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border border-gray-100 p-10 rounded-[56px] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[280px]"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Discharged
                      </span>
                      <p className="text-[10px] font-mono text-gray-300">REF: {record._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <h4 className="font-black text-2xl text-[#1F2937] leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {record.propertyId?.address}
                    </h4>
                    <p className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                       Settled Refund: <span className="text-black">₹{record.finalRefundAmount?.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between relative z-10">
                    <div className="text-gray-300">
                       <p className="text-[9px] font-black uppercase tracking-tighter">Moved Out</p>
                       <p className="text-xs font-bold">{new Date(record.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/dashboard-tenant/lease-summary/${record._id}`}>
                      <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl font-bold text-xs hover:bg-[#1F2937] hover:text-white transition-all">
                        View Report <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                  {/* Decorative background element */}
                  <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-50/40 blur-[60px] rounded-full group-hover:bg-blue-100/50 transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // 🎉 CASE B: ACTIVE RESIDENCY (Sidebar visible via Layout)
  const isVerified = inspection?.status === "verified";

  return (
    <div className="p-8 md:p-16 max-w-6xl mx-auto space-y-12 pb-40">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-[#1F2937] tracking-tight">Active Residence</h1>
        <p className="text-gray-400 font-medium italic text-lg">
            {isVerified ? "Secured by RentEase at " : "Awaiting Verification for "} 
            <span className="text-black font-bold border-b-2 border-blue-100">{property?.address}</span>
        </p>
      </header>
      
      {/* ACTIVE STATUS CARD */}
      <div className={`rounded-[64px] p-12 shadow-sm border flex flex-col md:flex-row justify-between items-center relative overflow-hidden transition-all duration-700 ${
        isVerified ? 'bg-white border-gray-100' : 'bg-orange-50/40 border-orange-100'
      }`}>
        <div className="relative z-10">
          <div className={`flex items-center gap-2 mb-8 font-black uppercase text-[10px] tracking-[0.3em] ${
            isVerified ? 'text-[#0D9488]' : 'text-orange-500'
          }`}>
            {isVerified ? <><CheckCircle2 size={20}/> Evidence Locked & Protected</> : <><ShieldAlert size={20} className="animate-pulse"/> Move-In Audit Pending</>}
          </div>
          <h2 className="text-4xl font-black text-[#1F2937] mb-4">{property?.address}</h2>
          
          <div className="flex gap-12 mt-12">
             <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p><p className="text-3xl font-black text-emerald-600">₹{property?.rentAmount?.toLocaleString()}</p></div>
             <div className="w-[1px] bg-gray-100 h-16" />
             <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vault Status</p><p className="text-3xl font-black text-gray-800 uppercase tracking-tighter">{isVerified ? "Active" : "Locked"}</p></div>
          </div>
        </div>

        <div className="mt-12 md:mt-0 flex flex-col gap-4 relative z-10 w-full md:w-auto">
           {isVerified ? (
             <>
               <Link href="/dashboard-tenant/maintenance" className="px-12 py-5 bg-[#1F2937] text-white rounded-[32px] font-bold text-xs uppercase tracking-widest text-center hover:bg-black transition-all shadow-xl">Report Maintenance</Link>
               <Link href="/dashboard-tenant/exit" className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em] text-center py-4">Initiate Lease Termination</Link>
             </>
           ) : (
             <Link href="/dashboard-tenant/witness" className="px-12 py-6 bg-[#0D9488] text-white rounded-[32px] font-black text-xs uppercase tracking-widest text-center hover:bg-[#0A7A6F] transition-all shadow-2xl flex items-center justify-center gap-3">
               <Zap size={18} /> {inspection ? "Review Your Audit" : "Begin Move-In Audit"}
             </Link>
           )}
        </div>
        {!isVerified && <div className="absolute top-0 right-0 w-[40%] h-full bg-orange-100/20" style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />}
      </div>

      {/* 🔒 SIDEBAR FEATURES LOCK ALERT */}
      {!isVerified && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-dashed border-gray-100 p-12 rounded-[56px] text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300"><Clock size={36} /></div>
            <h3 className="text-2xl font-black text-[#1F2937] mb-3">Feature Portals Locked</h3>
            <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
              To maintain the integrity of your security deposit, financial and maintenance portals unlock only after the owner verifies your condition audit.
            </p>
        </motion.div>
      )}
    </div>
  );
}