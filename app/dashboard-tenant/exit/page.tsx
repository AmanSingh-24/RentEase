"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, CheckCircle, ArrowRight, Loader2, Hourglass, 
  Send, ShieldCheck, Clock, Download, DollarSign, Heart, 
  MessageSquareWarning, X, LogOut, User, FileText, Camera
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
  const [ids, setIds] = useState({ propertyId: "", ownerId: "", tenantId: "" });
  const [photos, setPhotos] = useState<{area: string, url: string, condition?: string}[]>([]);
  const [comparisonGrid, setComparisonGrid] = useState<any[]>([]);

  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      const currentTenantId = authData.user?._id;

      const propRes = await fetch(`/api/properties/get-by-tenant`);
      const propData = await propRes.json();
      if (propRes.ok && propData.property && currentTenantId) {
        setIds({ propertyId: propData.property._id, ownerId: propData.property.ownerId, tenantId: currentTenantId });
      }
      fetchStatus();
    } catch (err) { console.error("Initialization failed", err); }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/exit/get-status`);
      const data = await res.json();
      if (res.ok && data.exit) {
        let exit = data.exit;

        // 👻 GHOST TENANT TRIGGER
        if (exit.status === "notice_accepted" && exit.moveOutDate) {
           const moveOut = new Date(exit.moveOutDate);
           moveOut.setHours(0,0,0,0);
           const today = new Date();
           today.setHours(0,0,0,0);
           if (today >= moveOut) {
              await fetch("/api/exit/respond-notice", {
                 method: "PUT",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ exitId: exit._id, status: "physical_inspection_required" })
              });
              exit.status = "physical_inspection_required";
           }
        }

        setExitData(exit);
        
        // 📸 FETCH DYNAMIC COMPARISON GRID FOR THE UPLOAD MATRIX
        const compRes = await fetch(`/api/exit/get-comparison?exitId=${exit._id}`);
        const compData = await compRes.json();
        if (compRes.ok && compData.comparisonGrid) {
           setComparisonGrid(compData.comparisonGrid);
        }
        
        // 🕒 AUTOMATED RE-COUPLING CRON SHIELD
        if (data.exit.status === "payout_released") {
           const settledTime = new Date(data.exit.updatedAt || data.exit.noticeDate).getTime();
           if (new Date().getTime() - settledTime > 24 * 60 * 60 * 1000) {
              handleAction("archived");
           }
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

  // 📄 DISCHARGE HANDSHAKE PRINT TEMPLATE ENGINE
  const triggerPrintCertificate = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Popup blocked! Please allow popups to download report.");
    
    const deductionRows = exitData.deductions?.map((d: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #374151;">${d.item}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-style: italic;">${d.reason || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #DC2626; font-weight: bold;">-₹${d.amount}</td>
      </tr>
    `).join("") || "<tr><td colspan='3' style='padding:12px; text-align:center; color:#9CA3AF;'>No adjustments recorded. Clean handover.</td></tr>";

    printWindow.document.write(`
      <html>
        <head>
          <title>Discharge_Settlement_REF_${exitData._id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
            .header { text-align: center; border-bottom: 4px solid #1F2937; padding-bottom: 20px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #F9FAFB; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; color: #6B7280; }
            .total-box { background: #1F2937; color: white; padding: 24px; border-radius: 16px; margin-top:40px; display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Discharge & Release Certificate</h1><p>RentEase Security Vault Documentation Ledger</p></div>
          <p><b>Settlement Ref:</b> REF-${exitData._id.slice(-8).toUpperCase()}</p>
          <table>
            <thead><tr><th>Adjustment Item</th><th>Justification Description</th><th style="text-align:right;">Impact</th></tr></thead>
            <tbody>${deductionRows}</tbody>
          </table>
          <div class="total-box">
             <div><span>Net Escrow Discharged Credit</span><br/><b style="font-size:20px;">₹${exitData.finalRefundAmount.toLocaleString()}</b></div>
             <div>SIGNATURE_VALIDATED_OK</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  // 🕒 LOGIC ENGINE VARIABLES
  const status = exitData?.status;
  const isSatisfied = exitData?.isTenantSatisfied;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const moveOut = exitData?.moveOutDate ? new Date(exitData.moveOutDate) : null;
  const auditStartDate = moveOut ? new Date(moveOut.getTime() - (7 * 24 * 60 * 60 * 1000)) : null;
  
  // ✅ FIX: Named consistently as settlementDate to match the UI blocks below
  const settlementDate = moveOut ? new Date(moveOut.getTime() + (14 * 24 * 60 * 60 * 1000)).toLocaleDateString() : "";
  
  const canStartAudit = auditStartDate ? today >= auditStartDate : false;
  const isInspectorHere = exitData?.inspectionDate ? today >= new Date(exitData.inspectionDate) : false;

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto pb-40 space-y-12">
      <header className="text-center"><h1 className="text-5xl font-black text-[#1F2937] tracking-tighter italic">Tenancy Exit</h1></header>

      {/* LAYER 1: BASE DEPLOYMENT PROPOSALS */}
      {!exitData && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-10 shadow-xl space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Move-Out Date (Min. 30 Days)</label>
              <input type="date" min={minDate} onChange={(e) => setProposedDate(e.target.value)} className="w-full p-6 bg-gray-50 rounded-[32px] font-bold outline-none border-2 border-transparent focus:border-blue-100" />
            </div>
            <textarea placeholder="Reason for leaving..." rows={4} onChange={(e) => setReason(e.target.value)} className="w-full p-8 bg-gray-50 rounded-[32px] font-bold outline-none border-2 border-transparent focus:border-blue-100" />
          </div>
          <button 
             disabled={!proposedDate || isSubmitting}
             onClick={async () => {
              setIsSubmitting(true);
              await fetch("/api/exit/serve-notice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...ids, moveOutDate: proposedDate, reason })
              });
              fetchStatus();
          }} className="w-full py-8 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs disabled:opacity-30">Serve Notice</button>
        </div>
      )}

      {/* LAYER 2: CHRONO NOTICE CALENDAR NEGOTIATION */}
      {exitData && (status === "notice_served" || status === "notice_rescheduled") && (
        <div className="bg-white border border-gray-100 rounded-[48px] p-12 text-center shadow-sm">
          {status === "notice_served" ? (
            <div className="space-y-6">
              <Hourglass className="mx-auto text-blue-500 animate-spin-slow" size={48} />
              <h2 className="text-2xl font-bold">Awaiting Date Authorization</h2>
              <p className="text-gray-400">Owner is reviewing requested point: <b className="text-black">{new Date(exitData.moveOutDate).toLocaleDateString()}</b></p>
            </div>
          ) : (
            <div className="space-y-8">
              <Clock className="mx-auto text-orange-500 animate-pulse" size={48} />
              <h2 className="text-2xl font-bold">Landlord Alternative Term</h2>

              <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 max-w-sm mx-auto shadow-inner">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Landlord Proposed Date</p>
                <p className="text-3xl font-black text-orange-900">{new Date(exitData.moveOutDate).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <button onClick={() => handleAction("notice_accepted")} className="py-6 bg-emerald-500 text-white rounded-[32px] font-black text-xs">Accept & Lock Calendar Target</button>
                <input type="date" min={minDate} onChange={(e) => setNewProposedDate(e.target.value)} className="p-6 bg-gray-50 rounded-[32px] font-bold text-sm outline-none" />
                <button disabled={!newProposedDate} onClick={() => handleAction("notice_served", { moveOutDate: newProposedDate })} className="py-6 bg-[#1F2937] text-white rounded-[32px] font-black text-xs">Counter Propose</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LAYER 3: CONDITIONS MATRIX SUBMISSION COUNTERBLOCKS */}
      {status === "notice_accepted" && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-12 shadow-sm text-center">
          {!canStartAudit ? (
             <>
               <CheckCircle className="mx-auto text-emerald-500 mb-6" size={48} />
               <h2 className="text-3xl font-black">Calendar Term Synchronized</h2>
               <p className="text-gray-400 font-medium">Locked for: {new Date(exitData.moveOutDate).toLocaleDateString()}</p>
               <p className="text-xs text-blue-500 font-bold mt-4">Digital Witness unlocks on {auditStartDate?.toLocaleDateString()}</p>
             </>
          ) : (
             <div className="space-y-8 text-left">
               <div className="text-center mb-10">
                 <Camera className="mx-auto text-blue-600 mb-4" size={48} />
                 <h2 className="text-3xl font-black">Digital Witness Open</h2>
                 <p className="text-gray-500 font-medium mt-2">Submit your current room photos for the final exit comparison. Failure to submit before move-out day forfeits your dispute rights.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 {comparisonGrid.map(item => {
                    const area = item.area;
                    const uploaded = photos.find(p => p.area === area);
                    return (
                      <div key={area} className="relative bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center min-h-[220px] group overflow-hidden">
                        {uploaded ? (
                           <>
                             <img src={uploaded.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                             <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                               <CheckCircle className="text-emerald-400 mb-2" size={32} />
                               <span className="text-white font-bold text-[10px] uppercase bg-black/50 px-3 py-1 rounded-full">{uploaded.condition}</span>
                             </div>
                             <button onClick={() => setPhotos(prev => prev.filter(p => p.area !== area))} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full z-10 hover:bg-red-600 transition-colors shadow-lg"><X size={14}/></button>
                           </>
                        ) : (
                           <div className="w-full flex flex-col items-center z-10 space-y-3">
                             <Camera className="text-gray-400 group-hover:text-blue-500 transition-colors" size={24} />
                             <span className="font-bold text-gray-500 text-sm group-hover:text-blue-600 text-center leading-tight">{area}</span>
                             
                             <div className="w-full mt-4">
                                <select 
                                   id={`select-${area.replace(/\s+/g, '-')}`}
                                   className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none text-gray-600 mb-3 shadow-sm hover:border-blue-300 transition-colors"
                                >
                                   <option value="Good">Condition: Good</option>
                                   <option value="Fair">Condition: Fair</option>
                                   <option value="Poor">Condition: Poor</option>
                                </select>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => document.getElementById(`file-${area.replace(/\s+/g, '-')}`)?.click()}
                                    className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors"
                                  >
                                    Upload
                                  </button>
                                  <button 
                                    onClick={() => document.getElementById(`camera-${area.replace(/\s+/g, '-')}`)?.click()}
                                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Camera size={14} /> Snap
                                  </button>
                                </div>
                             </div>
                             <input id={`file-${area.replace(/\s+/g, '-')}`} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                if(e.target.files && e.target.files[0]) {
                                   const reader = new FileReader();
                                   reader.onload = (ev) => {
                                      const condition = (document.getElementById(`select-${area.replace(/\s+/g, '-')}`) as HTMLSelectElement)?.value || 'Good';
                                      const url = ev.target?.result as string;
                                      setPhotos(prev => [...prev.filter(p => p.area !== area), { area, url, condition }]);
                                   };
                                   reader.readAsDataURL(e.target.files[0]);
                                }
                             }} />
                             <input id={`camera-${area.replace(/\s+/g, '-')}`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                if(e.target.files && e.target.files[0]) {
                                   const reader = new FileReader();
                                   reader.onload = (ev) => {
                                      const condition = (document.getElementById(`select-${area.replace(/\s+/g, '-')}`) as HTMLSelectElement)?.value || 'Good';
                                      const url = ev.target?.result as string;
                                      setPhotos(prev => [...prev.filter(p => p.area !== area), { area, url, condition }]);
                                   };
                                   reader.readAsDataURL(e.target.files[0]);
                                }
                             }} />
                           </div>
                        )}
                      </div>
                    )
                 })}
               </div>
               
               <button 
                 disabled={comparisonGrid.length === 0 || photos.length < comparisonGrid.length || isSubmitting} 
                 onClick={() => handleAction("photos_submitted", { moveOutPhotos: photos })} 
                 className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest disabled:opacity-30 mt-6 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
               >
                 {photos.length < comparisonGrid.length ? `Upload all ${comparisonGrid.length} photos to submit` : "Submit Evidence Matrix"}
               </button>
             </div>
          )}
        </div>
      )}

      {status === "photos_submitted" && (
        <div className="bg-white border border-gray-100 rounded-[56px] p-16 text-center shadow-sm">
           <ShieldCheck className="mx-auto text-blue-600 animate-pulse mb-8" size={64} />
           <h2 className="text-3xl font-black">Evidence Analysis Pending</h2>
           <p className="text-gray-400 mt-4 italic">Comparison pipelines are parsing current room uploads.</p>
        </div>
      )}

      {status === "physical_inspection_required" && (
        <div className="bg-white border border-orange-100 rounded-[56px] p-12 text-center shadow-lg">
           <User className="mx-auto text-orange-500 mb-8" size={64} />
           <h2 className="text-3xl font-black text-orange-900 uppercase">In-Person Audit Underway</h2>
           <div className="my-10 space-y-3 p-8 bg-gray-50 rounded-[32px] text-left max-w-xs mx-auto">
              <p className="text-xs font-bold">Inspector: <b className="text-black">{exitData.inspectorName}</b></p>
              <p className="text-xs font-bold">Date Scheduled: <b className="text-black">{new Date(exitData.inspectionDate).toLocaleDateString()}</b></p>
           </div>
           <button disabled={!isInspectorHere} onClick={() => handleAction("physical_inspection_done")} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30">Confirm Handover Actions Complete</button>
        </div>
      )}

      {/* 🟢 STAGE 6: CONDITION APPROVED */}
      {(status === "physical_inspection_done" || status === "inspection_completed") && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[56px] p-16 text-center">
           <CheckCircle className="mx-auto text-emerald-500 mb-10" size={64} />
           <h2 className="text-4xl font-black text-emerald-900">Condition Approved!</h2>
           <p className="text-emerald-700/60 mt-4 text-lg font-medium italic">
              Your exit audit has been cleared by the landlord. The final financial settlement ledger breakdown will unlock on <b className="text-emerald-900 underline">{settlementDate || "the designated day"}</b>.
           </p>
        </div>
      )}

      {/* LAYER 4: LEDGER BALANCE RESOLUTION BLOCKS */}
      
      {/* PHASE A: REVIEW STATEMENT DISPATCH */}
      {status === "settled" && !isSatisfied && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1F2937] text-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden">
          <p className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.4em] mb-4">Refund Matrix Compilation Ready</p>
          <h2 className="text-6xl font-black tracking-tighter">₹{exitData.finalRefundAmount.toLocaleString()}</h2>
          
          <div className="my-10 p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
             <h4 className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Deduction Logs Breakdown</h4>
             {exitData.deductions?.map((d: any, i: number) => (
               <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                  <span className="font-bold text-gray-300">{d.item}</span>
                  <span className="text-red-400 font-black">- ₹{d.amount}</span>
               </div>
             ))}
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={() => handleAction("settled", { isTenantSatisfied: true })} className="w-full py-7 bg-emerald-500 rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Sign & Accept Calculation Terms <Heart size={14} className="inline ml-1"/></button>
            <button onClick={() => setShowDisputeModal(true)} className="w-full py-4 text-gray-500 font-black text-[10px] uppercase hover:text-red-400 transition-colors">Request Ledger Revision</button>
          </div>
        </motion.div>
      )}

      {/* PHASE B: SIGNED BY TENANT, INTERMEDIATE BUFFER FOR GATEWAY TRACKING */}
      {status === "settled" && isSatisfied && (
         <div className="bg-white border border-blue-100 rounded-[56px] p-16 text-center shadow-xl animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-10 animate-pulse"><Clock size={40}/></div>
            <h2 className="text-3xl font-black text-[#1F2937]">Signature Lodged Successfully</h2>
            <p className="text-gray-400 mt-4 max-w-sm mx-auto italic leading-relaxed">Terms accepted. Awaiting landlord closure confirmation and currency clearance via RentEase gateway wires.</p>
         </div>
      )}

      {/* PHASE C: CAPITAL RELEASED - FULL TERMINATION GENERATOR */}
      {status === "payout_released" && (
        <div className="bg-white border border-emerald-100 rounded-[56px] p-16 text-center shadow-xl animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10"><CheckCircle size={48} /></div>
           <h2 className="text-4xl font-black text-emerald-900">Capital Refund Cleared!</h2>
           <p className="text-gray-500 mt-4 max-w-sm mx-auto font-medium">The amount of <b className="text-black">₹{exitData.finalRefundAmount.toLocaleString()}</b> has been successfully resolved. Secure your download logs below to decouple.</p>
           
           <div className="flex flex-col gap-4 mt-12 max-w-xs mx-auto">
              <button onClick={triggerPrintCertificate} className="py-5 bg-gray-50 border border-gray-100 text-blue-600 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"><FileText size={14}/> Download Handover Summary</button>
              <button onClick={() => handleAction("archived")} className="py-7 bg-red-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Sever Tenancy Agreement & Exit Portal</button>
           </div>
        </div>
      )}

      {/* PHASE D: TEMPORAL DISPUTE LOOP REVIEWS */}
      {status === "disputed" && (
        <div className="bg-white border border-red-100 rounded-[56px] p-16 text-center shadow-sm animate-in fade-in duration-300">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8"><Hourglass className="animate-spin-slow" size={32} /></div>
           <h2 className="text-3xl font-black text-[#1F2937]">Revision Under Review</h2>
           <p className="text-gray-400 mt-4 leading-relaxed">The landlord has been locked out of settlement releases until they analyze your feedback comment: <br/><b className="text-black italic">"{exitData.tenantDisputeComment}"</b></p>
        </div>
      )}

      {/* DISPUTE SELECTION SHEET MODAL */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[200] bg-[#1F2937]/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] p-12 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-3"><MessageSquareWarning className="text-red-500"/> State Dispute</h2>
              <textarea rows={5} placeholder="Detail item arguments clearly for recalculation processing..." className="w-full p-6 bg-gray-50 border rounded-3xl text-sm mb-8 outline-none focus:border-red-400 focus:bg-white transition-colors" onChange={(e) => setDisputeReason(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setShowDisputeModal(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button onClick={() => { handleAction("disputed", { tenantDisputeComment: disputeReason }); }} className="flex-[2] py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Submit Revision Request</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}