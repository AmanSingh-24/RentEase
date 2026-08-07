"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, Clock, Calendar, Camera, Loader2, 
  CheckCircle2, ShieldCheck, X, Send, Hourglass, DollarSign, Lock, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerExitInbox() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Negotiation States
  const [activeNegotiation, setActiveNegotiation] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🗓️ 30-Day Guardrail Constraint
  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/exit/get-owner-requests`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } catch (err) { 
      console.error("Vault request gathering sync failure:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAction = async (status: string, chosenDate?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exit/respond-notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          exitId: activeNegotiation._id, 
          status, 
          moveOutDate: chosenDate || activeNegotiation.moveOutDate 
        })
      });
      if (res.ok) {
        setActiveNegotiation(null);
        setRescheduleDate("");
        fetchRequests();
      }
    } catch (err) {
      console.error("Negotiation state submission error:", err);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const forceAccept = async (req: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exit/respond-notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitId: req._id, status: "notice_accepted", moveOutDate: req.moveOutDate })
      });
      if (res.ok) fetchRequests();
    } finally { setIsSubmitting(false); }
  };

  // 📋 LEDGER EXECUTIVE REPORT PRINT GENERATOR
  const triggerPrintLedger = (req: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Popup blocker active. Enable popups to print report templates.");

    const lines = req.deductions?.map((d: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold;">${d.item}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${d.reason || "No explicit comment"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #DC2626; font-weight: bold;">-₹${d.amount}</td>
      </tr>
    `).join("") || "<tr><td colspan='3' style='padding: 10px; text-align: center; color: #9CA3AF;'>No adjustment penalties applied. Full refund distribution schema.</td></tr>";

    printWindow.document.write(`
      <html>
        <head>
          <title>RentEase_Executive_Settlement_Summary_${req._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1F2937; }
            .header-bar { border-bottom: 3px solid #1F2937; padding-bottom: 15px; margin-bottom: 30px; }
            .section-lbl { font-size: 10px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 2px; font-weight: bold; margin-bottom: 4px; }
            .section-val { font-size: 14px; font-weight: bold; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { text-align: left; background: #F3F4F6; padding: 10px; font-size: 11px; text-transform: uppercase; color: #4B5563; }
            .total-banner { background: #1F2937; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; font-style: italic; font-weight: 900;">Executive Settlement Closeout Ledger</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B7280;">RentEase Corporate Ecosystem Vault Services</p>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div class="section-lbl">Settlement Context ID</div><div class="section-val">REC-${req._id.slice(-8).toUpperCase()}</div>
              <div class="section-lbl">Associated Tenant Node</div><div class="section-val">${req.tenantId?.name || "System Archive Unit"}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-lbl">Closure Execution Date</div><div class="section-val">${new Date(req.createdAt).toLocaleDateString()}</div>
              <div class="section-lbl">Archival Status System</div><div class="section-val" style="color:#10B981;">VERIFIED_PAYOUT_RELEASED</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Ledger Deduction Item</th><th>Context Framework Description</th><th style="text-align: right;">Impact</th></tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <div class="total-banner">
            <div><span style="font-size: 10px; text-transform: uppercase; opacity: 0.7;">Discharged Refund Transferred</span><h2 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900;">₹${req.finalRefundAmount.toLocaleString()}</h2></div>
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px; border-radius: 6px;">Handshake Completed</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- Filtering Pipeline Arrays ---
  const freshNotices = requests.filter((r: any) => r.status === "notice_served");
  const waitingForTenant = requests.filter((r: any) => r.status === "notice_rescheduled");
  
  const auditPipeline = requests.filter((r: any) => 
    ["notice_accepted", "photos_submitted", "physical_inspection_required", "physical_inspection_done"].includes(r.status)
  );

  const settlementQueue = requests.filter((r: any) => 
    ["inspection_completed", "settled", "disputed"].includes(r.status)
  );

  const historicalLogs = requests.filter((r: any) => 
    ["payout_released", "archived"].includes(r.status)
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Exit Vault...</p>
    </div>
  );

  return (
    <div className="p-10 max-w-6xl mx-auto pb-40 space-y-20">
      <header>
        <h1 className="text-5xl font-black italic text-[#1F2937] tracking-tighter">Exit Control Center</h1>
        <p className="text-gray-400 font-medium mt-2">Manage move-out dates, check physical evidence metrics, and release escrow data.</p>
      </header>

      {/* 💰 PIPELINE 1: FINANCIAL SETTLEMENT QUEUE */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <DollarSign size={14}/> Financial Settlement Queue
        </h2>
        <div className="grid gap-4">
          {settlementQueue.map((req: any) => {
             const today = new Date();
             const moveOut = new Date(req.moveOutDate);
             const settlementUnlock = new Date(moveOut.getTime() - 86400000);
             const isSettlementEnabled = today >= settlementUnlock;

             return (
              <div key={req._id} className="bg-[#1F2937] p-8 rounded-[40px] flex items-center justify-between text-white group shadow-xl">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400"><DollarSign size={28}/></div>
                  <div>
                    <h3 className="font-bold text-lg uppercase tracking-tight">{req.tenantId?.name || "System Record Node"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                        req.status === 'disputed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-400/10 text-emerald-400'
                      }`}>
                        {req.status === 'disputed' ? 'Dispute Modification Needed' : 'Condition Cleared'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  disabled={!isSettlementEnabled}
                  onClick={() => router.push(`/dashboard-owner/exit/${req._id}/settlement`)}
                  className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
                    isSettlementEnabled 
                      ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95' 
                      : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {isSettlementEnabled ? "Open Ledger Matrix" : <> <Lock size={12}/> Locked until ${settlementUnlock.toLocaleDateString()}</>}
                  <ArrowRight size={12}/>
                </button>
              </div>
             )
          })}
          {settlementQueue.length === 0 && <p className="text-xs text-gray-300 italic ml-4 font-bold uppercase tracking-wider">No pending statements in reconciliation channel.</p>}
        </div>
      </section>

      {/* 📥 PIPELINE 2: FRESH NOTICES (Action Required) */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Clock size={14}/> Action Required: Date Proposal Review
        </h2>
        <div className="grid gap-4">
          {freshNotices.map((req: any) => (
            <div key={req._id} onClick={() => setActiveNegotiation(req)} className="bg-white border border-orange-100 p-8 rounded-[40px] flex items-center justify-between hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-colors"><Calendar size={24} /></div>
                <div>
                  <h3 className="font-bold text-[#1F2937] text-lg uppercase">{req.tenantId?.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Proposed Close Date: {new Date(req.moveOutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="bg-orange-50 px-6 py-3 rounded-2xl text-orange-600 font-black text-[10px] uppercase tracking-widest group-hover:bg-orange-600 group-hover:text-white transition-colors">Open Negotiation</div>
            </div>
          ))}
          {freshNotices.length === 0 && <p className="text-xs text-gray-300 font-bold uppercase italic ml-4">No fresh exit proposals on ledger.</p>}
        </div>
      </section>

      {/* ⏳ PIPELINE 3: WAITING FOR TENANT RESPONSE */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <Hourglass size={14}/> Outbound Counter-Offers Sent
        </h2>
        <div className="grid gap-4">
          {waitingForTenant.map((req: any) => {
            const lastUpdated = req.updatedAt ? new Date(req.updatedAt).getTime() : new Date(req.createdAt).getTime();
            const hoursElapsed = (Date.now() - lastUpdated) / (1000 * 60 * 60);
            const is48hExpired = hoursElapsed >= 48;

            return (
            <div key={req._id} className="bg-gray-50/50 border border-gray-100 p-8 rounded-[40px] flex items-center justify-between opacity-70">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-3xl bg-white text-gray-300 flex items-center justify-center border border-gray-100"><Clock size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-500 text-lg uppercase">{req.tenantId?.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Proposal: {new Date(req.moveOutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase italic">
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" /> Awaiting Tenant Decoupling Accept
                </div>
                <button 
                  disabled={isSubmitting || !is48hExpired}
                  onClick={() => forceAccept(req)}
                  className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors border ${
                    is48hExpired 
                      ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100" 
                      : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {is48hExpired ? "Force Accept (48h Expired)" : `Locked (${Math.max(0, Math.floor(48 - hoursElapsed))}h remaining)`}
                </button>
              </div>
            </div>
            )
          })}
          {waitingForTenant.length === 0 && <p className="text-xs text-gray-300 font-bold uppercase italic ml-4">No pending outbound counter-offers.</p>}
        </div>
      </section>

      {/* 📸 PIPELINE 4: ACTIVE CONDITION AUDIT CHANNEL */}
      <section className="space-y-8">
        <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
          <Camera size={14}/> Active Structural Audit Pipelines
        </h2>
        <div className="grid gap-4">
          {auditPipeline.map((req: any) => {
             const today = new Date();
             const auditUnlock = new Date(new Date(req.moveOutDate).getTime() - (7 * 86400000));
             const isAuditEnabled = today >= auditUnlock;

             return (
              <div key={req._id} className="bg-white border border-gray-100 p-8 rounded-[40px] flex items-center justify-between group shadow-sm hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-8">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${isAuditEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}><Camera size={28}/></div>
                  <div>
                    <h3 className="font-bold text-[#1F2937] text-lg uppercase">{req.tenantId?.name}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase mt-1 tracking-widest">
                      Current Matrix Phase: {req.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <button 
                  disabled={!isAuditEnabled}
                  onClick={() => router.push(`/dashboard-owner/exit/${req._id}`)}
                  className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
                    isAuditEnabled 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-black active:scale-95' 
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                  }`}
                >
                  {isAuditEnabled ? "Inspect Evidence Vault" : `Locked until ${auditUnlock.toLocaleDateString()}`}
                  <ArrowRight size={14}/>
                </button>
              </div>
             )
          })}
          {auditPipeline.length === 0 && <p className="text-xs text-gray-300 font-bold uppercase italic ml-4">No active evidence audits running.</p>}
        </div>
      </section>

      {/* ✅ PIPELINE 5: ARCHIVED SYSTEM RECORDS HISTORICAL MATRIX */}
      <section className="space-y-8 pt-12 border-t border-gray-100">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <FileCheck size={14}/> Historical Vault Closeout Logs
        </h2>
        <div className="grid gap-4">
          {historicalLogs.map((req: any) => (
            <div key={req._id} className="bg-gray-50/70 border border-gray-200 p-8 rounded-[40px] flex items-center justify-between transition-all group hover:bg-white hover:border-gray-300">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-500 border border-gray-100 shadow-sm flex items-center justify-center font-black text-xs">OK</div>
                <div>
                  <h4 className="font-black text-[#1F2937] text-base uppercase tracking-tight">{req.tenantId?.name || "Terminated Node Archive"}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
                    Escrow Payout Discharged: <span className="text-emerald-600 font-black">₹{req.finalRefundAmount.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => triggerPrintLedger(req)} 
                className="px-6 py-4 bg-white border border-gray-200 text-gray-600 font-black text-[10px] uppercase rounded-2xl tracking-wider shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Print Ledger Summary
              </button>
            </div>
          ))}
          {historicalLogs.length === 0 && <p className="text-xs text-gray-300 uppercase font-black italic ml-4">No historical records in current session memory context block.</p>}
        </div>
      </section>

      {/* 🤝 OUTBOUND PROPOSAL NEGOTIATION MODAL TERMINAL */}
      <AnimatePresence>
        {activeNegotiation && (
          <div className="fixed inset-0 z-[100] bg-[#1F2937]/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[56px] p-12 max-w-xl w-full shadow-2xl relative border border-white/20">
              <button onClick={() => setActiveNegotiation(null)} className="absolute top-10 right-10 text-gray-300 hover:text-black transition-colors"><X size={24} /></button>
              
              <h2 className="text-3xl font-black mb-2 tracking-tight italic">Review Exit Proposal</h2>
              <p className="text-gray-400 text-sm mb-10">Tenant Node: <span className="text-black font-bold uppercase">{activeNegotiation.tenantId?.name}</span></p>

              <div className="p-10 bg-orange-50 rounded-[40px] border border-orange-100 mb-10 text-center shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Tenant Requested Move-Out Date</p>
                <p className="text-4xl font-black text-orange-900">{new Date(activeNegotiation.moveOutDate).toLocaleDateString()}</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleAction("notice_accepted")}
                  disabled={isSubmitting}
                  className="w-full py-6 bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={18}/>}
                  Accept Terms & Lock Date
                </button>

                <div className="h-px bg-gray-100 my-6" />

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Issue Alternative Date Proposal</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                    <input 
                      type="date" 
                      min={minDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-3xl font-bold text-sm outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  disabled={!rescheduleDate || isSubmitting}
                  onClick={() => handleAction("notice_rescheduled", rescheduleDate)}
                  className="w-full py-6 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs tracking-widest disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black"
                >
                  <Send size={16}/> Counter-Offer Outbound Date
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}