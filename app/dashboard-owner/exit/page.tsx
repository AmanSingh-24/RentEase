"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, Clock, Calendar, Camera, Loader2, 
  CheckCircle2, ShieldCheck, X, Send, Hourglass, DollarSign, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerExitInbox() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNegotiation, setActiveNegotiation] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const ownerId = localStorage.getItem("userId");
      const res = await fetch(`/api/exit/get-owner-requests?ownerId=${ownerId}`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } finally { setLoading(false); }
  };

  const handleAction = async (status: string, chosenDate?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exit/respond-notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitId: activeNegotiation._id, status, moveOutDate: chosenDate || activeNegotiation.moveOutDate })
      });
      if (res.ok) {
        setActiveNegotiation(null);
        fetchRequests();
      }
    } finally { setIsSubmitting(false); }
  };

  const freshNotices = requests.filter((r: any) => r.status === "notice_served");
  const waitingForTenant = requests.filter((r: any) => r.status === "notice_rescheduled");
  
  // Pipeline: Notice accepted, Photos submitted, Physical inspection loop
  const auditPipeline = requests.filter((r: any) => 
    ["notice_accepted", "photos_submitted", "physical_inspection_required", "physical_inspection_done"].includes(r.status)
  );

  // Settlement Queue: Condition cleared, waiting for the 24-hour mark
  const settlementQueue = requests.filter((r: any) => ["inspection_completed", "settled", "disputed"].includes(r.status));

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-10 max-w-6xl mx-auto pb-40 space-y-20">
      <header><h1 className="text-5xl font-black italic">Exit Control</h1></header>

      {/* 💰 NEW SECTION: SETTLEMENT QUEUE */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2"><DollarSign size={14}/> Financial Settlement Queue</h2>
        <div className="grid gap-4">
          {settlementQueue.map((req: any) => {
             const today = new Date();
             const moveOut = new Date(req.moveOutDate);
             const settlementUnlock = new Date(moveOut.getTime() - 86400000);
             const isSettlementEnabled = today >= settlementUnlock;

             return (
              <div key={req._id} className="bg-[#1F2937] p-8 rounded-[40px] flex items-center justify-between text-white group">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400"><DollarSign size={28}/></div>
                  <div>
                    <h3 className="font-bold text-lg uppercase">{req.tenantId?.name}</h3>
                    <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">Condition Cleared</span>
                  </div>
                </div>
                <button 
                  disabled={!isSettlementEnabled}
                  onClick={() => router.push(`/dashboard-owner/exit/${req._id}/settlement`)}
                  className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isSettlementEnabled ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'}`}
                >
                  {isSettlementEnabled ? "Finalize Statement" : <> <Lock size={12}/> Unlocks {settlementUnlock.toLocaleDateString()}</>}
                </button>
              </div>
             )
          })}
          {settlementQueue.length === 0 && <p className="text-xs text-gray-300 italic ml-4 font-bold uppercase">No finalized audits in queue.</p>}
        </div>
      </section>

      {/* 📥 SECTION 1: FRESH NOTICES (Action Required) */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Clock size={14}/> Action Required: Date Review
        </h2>
        <div className="grid gap-4">
          {freshNotices.map((req: any) => (
            <div key={req._id} onClick={() => setActiveNegotiation(req)} className="bg-white border border-orange-100 p-8 rounded-[40px] flex items-center justify-between hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-colors"><Calendar size={24} /></div>
                <div>
                  <h3 className="font-bold text-[#1F2937] text-lg uppercase">{req.tenantId?.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proposed: {new Date(req.moveOutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="bg-orange-50 px-6 py-3 rounded-2xl text-orange-600 font-black text-[10px] uppercase tracking-widest">Open Negotiation</div>
            </div>
          ))}
          {freshNotices.length === 0 && <p className="text-xs text-gray-300 font-bold uppercase italic ml-4">No new notices to review.</p>}
        </div>
      </section>

      {/* ⏳ SECTION 2: WAITING FOR TENANT */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <Hourglass size={14}/> Awaiting Tenant Response
        </h2>
        <div className="grid gap-4">
          {waitingForTenant.map((req: any) => (
            <div key={req._id} className="bg-gray-50/50 border border-gray-100 p-8 rounded-[40px] flex items-center justify-between opacity-70">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-3xl bg-white text-gray-300 flex items-center justify-center border border-gray-100"><Clock size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-500 text-lg uppercase">{req.tenantId?.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-wrap">You proposed: {new Date(req.moveOutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase italic">
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" /> Pending Tenant Approval
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📸 AUDIT PIPELINE */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={14}/> Active Audit Pipeline</h2>
        <div className="grid gap-4">
          {auditPipeline.map((req: any) => {
             const today = new Date();
             const auditUnlock = new Date(new Date(req.moveOutDate).getTime() - (7 * 86400000));
             const isAuditEnabled = today >= auditUnlock;

             return (
              <div key={req._id} className="bg-white border border-gray-100 p-8 rounded-[40px] flex items-center justify-between group">
                <div className="flex items-center gap-8">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${isAuditEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}><Camera size={28}/></div>
                  <div><h3 className="font-bold text-[#1F2937] text-lg uppercase">{req.tenantId?.name}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit Type: {req.status === 'photos_submitted' ? 'Reviewing Evidence' : 'Date Verification'}</p></div>
                </div>
                <button 
                  disabled={!isAuditEnabled}
                  onClick={() => router.push(`/dashboard-owner/exit/${req._id}`)}
                  className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isAuditEnabled ? 'bg-blue-600 text-white shadow-xl hover:bg-black' : 'bg-gray-100 text-gray-400 border border-gray-100'}`}
                >
                  {isAuditEnabled ? "Start Security Audit" : `Audit Unlocks ${auditUnlock.toLocaleDateString()}`}
                </button>
              </div>
             )
          })}
        </div>
      </section>

      
      {/* 🤝 NEGOTIATION MODAL */}
      <AnimatePresence>
        {activeNegotiation && (
          <div className="fixed inset-0 z-[100] bg-[#1F2937]/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[56px] p-12 max-w-xl w-full shadow-2xl relative border border-white/20">
              <button onClick={() => setActiveNegotiation(null)} className="absolute top-10 right-10 text-gray-300 hover:text-black transition-colors"><X size={24} /></button>
              
              <h2 className="text-3xl font-black mb-2 tracking-tight">Review Exit Proposal</h2>
              <p className="text-gray-400 text-sm mb-10 italic">Tenant: <span className="text-black font-bold">{activeNegotiation.tenantId?.name}</span></p>

              <div className="p-10 bg-orange-50 rounded-[40px] border border-orange-100 mb-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Tenant's Requested Date</p>
                <p className="text-4xl font-black text-orange-900">{new Date(activeNegotiation.moveOutDate).toLocaleDateString()}</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleAction("notice_accepted")}
                  disabled={isSubmitting}
                  className="w-full py-6 bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>}
                  Accept & Lock Date
                </button>

                <div className="h-px bg-gray-100 my-6" />

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Suggest Different Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                    <input 
                      type="date" 
                      min={minDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-3xl font-bold text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
                    />
                  </div>
                </div>

                <button 
                  disabled={!rescheduleDate || isSubmitting}
                  onClick={() => handleAction("notice_rescheduled", rescheduleDate)}
                  className="w-full py-6 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs tracking-widest disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16}/> Counter-Offer This Date
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}