"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, CheckCircle, ArrowRight, Loader2, Hourglass, 
  Send, ShieldCheck, Clock, Download, DollarSign, Heart, 
  MessageSquareWarning, X, LogOut, User
} from "lucide-react";

export default function TenantExitManager() {
  const router = useRouter();
  const [exitData, setExitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  
  const [proposedDate, setProposedDate] = useState("");
  const [reason, setReason] = useState("");
  const [newProposedDate, setNewProposedDate] = useState("");
  const [ids, setIds] = useState({ propertyId: "", ownerId: "" });

  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    try {
      const tenantId = localStorage.getItem("userId");
      const propRes = await fetch(`/api/properties/get-by-tenant?tenantId=${tenantId}`);
      const propData = await propRes.json();
      if (propRes.ok && propData.property) {
        setIds({ propertyId: propData.property._id, ownerId: propData.property.ownerId });
      }
      fetchStatus();
    } catch (err) { console.error("Initialization failed", err); }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/exit/get-status?tenantId=${localStorage.getItem("userId")}`);
      const data = await res.json();
      if (res.ok && data.exit) {
        setExitData(data.exit);
        // 🕒 24-HOUR AUTO TERMINATION
        if (data.exit.status === "settled" && data.exit.isTenantSatisfied) {
           const settledTime = new Date(data.exit.updatedAt || data.exit.noticeDate).getTime();
           if (new Date().getTime() - settledTime > 24 * 60 * 60 * 1000) handleAction("archived");
        }
      }
    } finally { setLoading(false); }
  };

  const handleAction = async (status: string, extra = {}) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/exit/respond-notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitId: exitData._id, status, ...extra })
      });
      if (status === "archived") window.location.href = "/";
      else fetchStatus();
    } finally { setIsSubmitting(false); setShowDisputeModal(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const moveOut = exitData?.moveOutDate ? new Date(exitData.moveOutDate) : null;
  const auditStartDate = moveOut ? new Date(moveOut.getTime() - (7 * 24 * 60 * 60 * 1000)) : null;
  const settlementDate = moveOut ? new Date(moveOut.getTime() - (24 * 60 * 60 * 1000)).toLocaleDateString() : "";
  const canStartAudit = auditStartDate ? today >= auditStartDate : false;
  const isInspectorHere = exitData?.inspectionDate ? today >= new Date(exitData.inspectionDate) : false;

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto pb-40 space-y-12">
      <header className="text-center">
        <h1 className="text-5xl font-black text-[#1F2937] tracking-tighter italic">Tenancy Exit</h1>
      </header>

      {/* 🟢 STAGE 1: NO NOTICE SERVED */}
      {!exitData && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-10 shadow-xl space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Move-Out Date (Min. 30 Days)</label>
              <input type="date" min={minDate} onChange={(e) => setProposedDate(e.target.value)} className="w-full p-6 bg-gray-50 rounded-[32px] font-bold outline-none border-2 border-transparent focus:border-blue-100" />
            </div>
            <textarea placeholder="Reason for leaving..." rows={4} onChange={(e) => setReason(e.target.value)} className="w-full p-8 bg-gray-50 rounded-[32px] font-bold outline-none border-2 border-transparent focus:border-blue-100" />
          </div>
          <button onClick={async () => {
              setIsSubmitting(true);
              await fetch("/api/exit/serve-notice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId: localStorage.getItem("userId"), ...ids, moveOutDate: proposedDate, reason })
              });
              fetchStatus();
          }} className="w-full py-8 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs">Serve Notice</button>
        </div>
      )}

      {/* 🟢 STAGE 2: NEGOTIATION */}
      {exitData && (exitData.status === "notice_served" || exitData.status === "notice_rescheduled") && (
        <div className="bg-white border border-gray-100 rounded-[48px] p-12 text-center shadow-sm">
          {exitData.status === "notice_served" ? (
            <div className="space-y-6">
              <Hourglass className="mx-auto text-blue-500 animate-spin-slow" size={48} />
              <h2 className="text-2xl font-bold">Waiting for Owner</h2>
              <p className="text-gray-400">Requesting date: <b className="text-black">{new Date(exitData.moveOutDate).toLocaleDateString()}</b></p>
            </div>
          ) : (
            <div className="space-y-8">
              <Clock className="mx-auto text-orange-500 animate-pulse" size={48} />
              <h2 className="text-2xl font-bold">Landlord Counter-Offer</h2>
              <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <button onClick={() => handleAction("notice_accepted")} className="py-6 bg-emerald-500 text-white rounded-[32px] font-black text-xs">Accept & Lock Date</button>
                <input type="date" min={minDate} onChange={(e) => setNewProposedDate(e.target.value)} className="p-6 bg-gray-50 rounded-[32px] font-bold text-sm outline-none" />
                <button disabled={!newProposedDate} onClick={() => handleAction("notice_served", { moveOutDate: newProposedDate })} className="py-6 bg-[#1F2937] text-white rounded-[32px] font-black text-xs">Counter Propose</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🟢 STAGE 3: DATE ACCEPTED */}
      {exitData?.status === "notice_accepted" && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-12 text-center shadow-sm">
          <CheckCircle className="mx-auto text-emerald-500 mb-6" size={48} />
          <h2 className="text-3xl font-black">Move-Out Locked: {new Date(exitData.moveOutDate).toLocaleDateString()}</h2>
          <div className="mt-12 p-10 bg-blue-50/50 rounded-[40px] border border-blue-100 max-w-md mx-auto">
            <ShieldCheck className={`mx-auto mb-4 ${canStartAudit ? 'text-blue-600' : 'text-gray-300'}`} size={40} />
            <p className="text-sm font-bold text-gray-800">
              {canStartAudit ? "Audit is now open." : `Audit unlocks on ${auditStartDate?.toLocaleDateString()}`}
            </p>
            {canStartAudit && <button onClick={() => router.push("/dashboard-tenant/exit/gallery")} className="mt-8 w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase">Start Audit</button>}
          </div>
        </div>
      )}

      {/* 🟢 STAGE 4: PHOTOS UNDER REVIEW */}
      {exitData?.status === "photos_submitted" && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-16 text-center shadow-sm">
           <ShieldCheck className="mx-auto text-blue-600 animate-pulse mb-8" size={64} />
           <h2 className="text-3xl font-black">Audit Under Review</h2>
           <p className="text-gray-400 mt-4 leading-relaxed italic">Owner is currently comparing your exit proof against the baseline.</p>
        </div>
      )}

      {/* 🟢 STAGE 5: PHYSICAL INSPECTION */}
      {exitData?.status === "physical_inspection_required" && (
        <div className="bg-white border border-orange-100 rounded-[56px] p-12 text-center shadow-lg">
           <User className="mx-auto text-orange-500 mb-8" size={64} />
           <h2 className="text-3xl font-black text-orange-900 uppercase tracking-tighter">In-Person Audit</h2>
           <div className="my-10 space-y-3 bg-orange-50/50 p-8 rounded-[40px] border border-orange-100 max-w-sm mx-auto text-left">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-orange-400 uppercase">Inspector</span><span className="font-bold text-orange-900">{exitData.inspectorName}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-orange-400 uppercase">Arrival Date</span><span className="font-bold text-orange-900">{new Date(exitData.inspectionDate).toLocaleDateString()}</span></div>
           </div>
           <button disabled={!isInspectorHere} onClick={() => handleAction("physical_inspection_done")} className={`w-full py-6 rounded-[32px] font-black uppercase text-xs tracking-widest ${isInspectorHere ? 'bg-orange-500 text-white shadow-xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed border'}`}>
             {isInspectorHere ? "Confirm Inspection Complete" : `Unlocks on ${new Date(exitData.inspectionDate).toLocaleDateString()}`}
           </button>
        </div>
      )}

      {/* 🟢 STAGE 6: CONDITION APPROVED */}
      {(exitData?.status === "physical_inspection_done" || exitData?.status === "inspection_completed") && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[56px] p-16 text-center">
           <CheckCircle className="mx-auto text-emerald-500 mb-10" size={64} />
           <h2 className="text-4xl font-black text-emerald-900">Condition Approved!</h2>
           <p className="text-emerald-700/60 mt-4 text-lg font-medium italic">Final financial settlement unlocks on <b className="text-emerald-900 underline">{settlementDate}</b>.</p>
        </div>
      )}

      {/* 🟢 STAGE 7: SETTLEMENT PROPOSED OR PAID */}
      {exitData?.status === "settled" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          {!exitData.isTenantSatisfied ? (
            /* REVIEW AMOUNT */
            <div className="bg-[#1F2937] text-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden">
              <p className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.4em] mb-4">Refund Ready for Review</p>
              <h2 className="text-6xl font-black tracking-tighter">₹{exitData.finalRefundAmount.toLocaleString()}</h2>
              <div className="my-10 p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
                 {exitData.deductions?.map((d: any, i: number) => (
                   <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-4"><span>{d.item}</span><span className="text-red-400 font-black">- ₹{d.amount}</span></div>
                 ))}
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={() => handleAction("settled", { isTenantSatisfied: true })} className="w-full py-7 bg-emerald-500 rounded-[32px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">I Accept this Amount <Heart size={16} className="inline ml-2"/></button>
                <button onClick={() => setShowDisputeModal(true)} className="w-full py-4 text-gray-500 font-black text-[10px] uppercase hover:text-red-400 transition-colors">Request Re-calculation</button>
              </div>
            </div>
          ) : (
            /* PAID & EXIT */
            <div className="bg-white border border-emerald-100 rounded-[56px] p-16 text-center shadow-xl">
               <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10"><CheckCircle size={48} /></div>
               <h2 className="text-4xl font-black text-[#1F2937]">Refund Dispatched</h2>
               <p className="text-gray-400 mt-4 max-w-sm mx-auto">The refund has been successfully released. Please download your discharge certificate before ending your session.</p>
               <div className="flex flex-col gap-4 mt-12 max-w-xs mx-auto">
                  <button onClick={() => router.push(`/dashboard-tenant/lease-summary/${exitData._id}`)} className="py-5 bg-gray-50 border border-gray-100 text-blue-600 rounded-3xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Download size={14}/> Download Exit Report</button>
                  <button onClick={() => handleAction("archived")} className="py-7 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-2">End Tenancy & Logout <LogOut size={16}/></button>
               </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 🟢 STAGE 8: DISPUTED */}
      {exitData?.status === "disputed" && (
        <div className="bg-white border border-red-100 rounded-[56px] p-16 text-center shadow-sm">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8"><Hourglass className="animate-spin-slow" size={32} /></div>
           <h2 className="text-3xl font-black text-[#1F2937]">Dispute Under Review</h2>
           <p className="text-gray-400 mt-4 leading-relaxed">Owner is reviewing your request for recalculation. <br/><b className="text-black italic">"{exitData.tenantDisputeComment}"</b></p>
        </div>
      )}

      {/* DISPUTE MODAL */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] p-12 max-w-lg w-full">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-3"><MessageSquareWarning className="text-red-500"/> Raise Dispute</h2>
              <textarea rows={5} placeholder="Reason for re-calculation..." className="w-full p-6 bg-gray-50 border rounded-3xl text-sm mb-8" onChange={(e) => setDisputeReason(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setShowDisputeModal(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button onClick={() => handleAction("disputed", { tenantDisputeComment: disputeReason })} className="flex-[2] py-5 bg-red-500 text-white rounded-3xl font-black text-[10px]">Submit Dispute</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}