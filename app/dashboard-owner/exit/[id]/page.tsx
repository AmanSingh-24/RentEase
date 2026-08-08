"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, AlertTriangle, Loader2, ShieldCheck, 
  X, Calendar, User, Phone, ArrowRight, DollarSign, ImageOff, 
  Wrench, History, ExternalLink, Clock, HardHat, Camera, Check, FileText, Send, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Move-out Notice", desc: "Notice accepted" },
  { id: 2, title: "Tenant Evidence", desc: "Digital witness photos" },
  { id: 3, title: "Condition Audit", desc: "Physical inspection & review" },
  { id: 4, title: "Final Settlement", desc: "Deductions & payout" }
];

export default function OwnerExitReview({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const exitId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [form, setForm] = useState({ inspectionDate: "", inspectorName: "", inspectorContact: "" });
  const [filter, setFilter] = useState("all");
  const [activeStep, setActiveStep] = useState(1);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/exit/get-comparison?exitId=${exitId}`);
      const result = await res.json();
      if (res.ok) {
        setData(result);
        determineActiveStep(result.exit.status);
      }
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
  };

  const determineActiveStep = (status: string) => {
    const s = status;
    if (["notice_served", "notice_rescheduled", "notice_accepted"].includes(s)) setActiveStep(1);
    else if (["photos_submitted"].includes(s)) setActiveStep(2);
    else if (["physical_inspection_required", "physical_inspection_done", "inspection_completed"].includes(s)) setActiveStep(3);
    else if (["settled", "disputed", "payout_released", "archived"].includes(s)) setActiveStep(4);
    else setActiveStep(1);
  };

  const handleDecision = async (status: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/exit/submit-decision", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitId, status, ...form })
      });
      
      if (res.ok) {
        if (status === "inspection_completed") {
          setActiveStep(4);
          await fetchData();
        } else {
          setShowPhysicalForm(false);
          await fetchData();
        }
      }
    } finally { setIsProcessing(false); }
  };

  const handleNegotiation = async (status: string, chosenDate?: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/exit/respond-notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          exitId, 
          status, 
          moveOutDate: chosenDate || data.exit.moveOutDate 
        })
      });
      if (res.ok) {
        setRescheduleDate("");
        await fetchData();
      }
    } finally { setIsProcessing(false); }
  };

  if (loading || !data || !data.exit) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={40} /></div>;

  const status = data.exit.status;
  const moveOutStr = data.exit.moveOutDate ? new Date(data.exit.moveOutDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  const moveOutDateObj = new Date(moveOutStr);
  const maxInspectionDateObj = new Date(moveOutDateObj.getTime() + (5 * 24 * 60 * 60 * 1000));
  const maxInspectionStr = maxInspectionDateObj.toISOString().split('T')[0];

  // Helper to determine if a step is "completed" in the overall timeline
  const isStepCompleted = (stepId: number) => {
    const s = status;
    if (stepId === 1) return !["notice_served", "notice_rescheduled"].includes(s); // notice_accepted means step 1 is done
    if (stepId === 2) return !["notice_served", "notice_rescheduled", "notice_accepted", "photos_submitted"].includes(s); // Must be past photos_submitted to be fully done with step 2? Actually, if photos_submitted, they uploaded it, so step 2 is "Action Required by Owner". We can mark it completed if status > photos_submitted.
    if (stepId === 3) return ["inspection_completed", "settled", "disputed", "payout_released", "archived"].includes(s);
    if (stepId === 4) return ["payout_released", "archived"].includes(s);
    return false;
  };

  const getStepStatusBadge = (stepId: number) => {
    if (isStepCompleted(stepId)) return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Completed</span>;
    if (stepId === activeStep) {
       if (stepId === 1 && status === "notice_accepted") return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Waiting Tenant</span>;
       return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase">In Progress</span>;
    }
    return <span className="bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Pending</span>;
  };

  return (
    <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">MOVE OUT WORKFLOW</h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">Manage the exit pipeline and settlement for your property.</p>
          </div>
          <div className="text-right">
             <div className="text-sm font-black text-neutral-900">{status.replace(/_/g, " ").toUpperCase()}</div>
             <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Current Pipeline Status</p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: TIMELINE (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24">
             <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-8">Process Timeline</h2>
             
             <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-neutral-200 before:z-0">
                {STEPS.map((step, index) => {
                   const isActive = activeStep === step.id;
                   const isCompleted = isStepCompleted(step.id);
                   
                   return (
                     <div 
                        key={step.id} 
                        onClick={() => setActiveStep(step.id)}
                        className={`relative flex items-stretch gap-6 cursor-pointer group transition-all`}
                     >
                        {/* Timeline Node */}
                        <div className="flex flex-col items-center mt-1 z-10 shrink-0">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow-sm transition-colors ${
                            isCompleted ? 'bg-emerald-500 border-white text-white' : 
                            isActive ? 'bg-neutral-900 border-white text-white' : 
                            'bg-white border-neutral-200 text-neutral-400'
                          }`}>
                             {isCompleted ? <Check size={16} strokeWidth={3}/> : <span className="font-bold text-sm">{step.id}</span>}
                          </div>
                        </div>

                        {/* Sleek Raw Text Node */}
                        <div className={`flex-1 py-1 transition-all ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                           <div className="flex flex-col items-start gap-1">
                              {getStepStatusBadge(step.id)}
                              <h3 className={`font-black text-sm uppercase mt-0.5 tracking-tight ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>{step.title}</h3>
                              <p className="text-[10px] font-bold text-neutral-400 leading-tight tracking-wide">{step.desc}</p>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

          {/* RIGHT: DYNAMIC CONTENT PANE (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
               
               {/* STEP 1: NOTICE */}
               {activeStep === 1 && (
                 <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200/60 shadow-sm">
                       <h2 className="text-xl font-black text-neutral-900 mb-6">Move-out Notice Details</h2>
                       <div className="grid grid-cols-2 gap-6 mb-8">
                         <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                           <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-1">Notice Date</p>
                           <p className="text-base font-bold text-neutral-900">{new Date(data.exit.noticeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                         </div>
                         <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                           <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-1">Move Out Date</p>
                           <p className="text-base font-bold text-neutral-900">{new Date(data.exit.moveOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                         </div>
                       </div>
                       
                       {status === "notice_accepted" && (
                          <div className="bg-orange-50 border border-orange-200 p-8 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center">
                             <Camera className="text-orange-300 mb-4" size={48} />
                             <h3 className="text-lg font-black text-orange-900">Waiting for Tenant Evidence</h3>
                             <p className="text-orange-700/80 text-xs mt-2 font-medium max-w-md leading-relaxed">The digital witness window is open. The tenant must upload their move-out photos and condition reports before you can review the condition.</p>
                          </div>
                       )}
                       
                       {status === "notice_rescheduled" && (
                          <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center">
                             <h3 className="text-lg font-black text-blue-900">Counter-Offer Sent</h3>
                             <p className="text-blue-700/80 text-xs mt-2 font-medium">You have proposed a new move-out date. Waiting for the tenant to accept the new terms.</p>
                             <button 
                               onClick={() => handleNegotiation("notice_accepted")}
                               disabled={isProcessing}
                               className="mt-6 px-6 py-3 bg-white text-blue-700 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-blue-200 shadow-sm hover:bg-blue-100 transition-colors"
                             >
                               {isProcessing ? <Loader2 className="animate-spin" size={16}/> : 'Force Accept Original Date'}
                             </button>
                          </div>
                       )}

                       {status === "notice_served" && (
                          <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl shadow-sm">
                             <h3 className="text-lg font-black text-neutral-900 mb-6">Review Exit Proposal</h3>
                             <div className="space-y-4 max-w-md mx-auto">
                               <button 
                                 onClick={() => handleNegotiation("notice_accepted")}
                                 disabled={isProcessing}
                                 className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2"
                               >
                                 {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Accept Terms & Lock Date
                               </button>

                               <div className="flex items-center gap-4 my-6 opacity-50">
                                 <div className="h-px bg-neutral-300 flex-1"></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">OR</span>
                                 <div className="h-px bg-neutral-300 flex-1"></div>
                               </div>

                               <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest block ml-2">Propose Alternative Date</label>
                                 <div className="relative">
                                   <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                   <input 
                                     type="date" 
                                     min={minDate}
                                     onChange={(e) => setRescheduleDate(e.target.value)}
                                     className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border border-neutral-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                                 </div>
                               </div>
                               <button 
                                 disabled={!rescheduleDate || isProcessing}
                                 onClick={() => handleNegotiation("notice_rescheduled", rescheduleDate)}
                                 className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                               >
                                 <Send size={14}/> Counter-Offer Date
                               </button>
                             </div>
                          </div>
                       )}

                       {isStepCompleted(1) && status !== "notice_accepted" && (
                          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-4 text-emerald-800">
                             <CheckCircle size={24} className="text-emerald-500 shrink-0"/>
                             <div>
                                <p className="font-bold text-sm">Notice Accepted</p>
                                <p className="text-xs font-medium opacity-80">You have successfully accepted the move-out date.</p>
                             </div>
                          </div>
                       )}
                    </div>
                 </motion.div>
               )}

               {/* STEP 2: EVIDENCE */}
               {activeStep === 2 && (
                 <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    {["notice_served", "notice_rescheduled", "notice_accepted"].includes(status) ? (
                       <div className="bg-white rounded-3xl p-12 border border-neutral-200/60 shadow-sm text-center">
                          <ImageOff className="text-neutral-300 mx-auto mb-4" size={48} />
                          <h2 className="text-xl font-black text-neutral-400">No Evidence Yet</h2>
                          <p className="text-neutral-400 text-xs mt-2 max-w-sm mx-auto">The tenant has not submitted their digital witness photos yet. This step will unlock once they upload their condition report.</p>
                       </div>
                    ) : (
                       <div className="space-y-6">
                          <div className="bg-white rounded-3xl p-8 border border-neutral-200/60 shadow-sm flex justify-between items-center">
                             <div>
                               <h2 className="text-xl font-black text-neutral-900">Tenant Evidence</h2>
                               <p className="text-xs font-medium text-neutral-500 mt-1">Review the photos uploaded by the tenant against the original baseline.</p>
                             </div>
                             
                             {status === "photos_submitted" && (
                               <div className="flex gap-3">
                                 <button onClick={() => setShowPhysicalForm(true)} className="px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors">
                                   <HardHat size={14}/> Assign Professional
                                 </button>
                                 <button onClick={() => handleDecision("inspection_completed")} className="px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 bg-neutral-900 text-white shadow-md hover:bg-black transition-colors">
                                   {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>} Approve Condition
                                 </button>
                               </div>
                             )}
                          </div>

                          {/* Evidence Grid */}
                          <div className="grid grid-cols-1 gap-6">
                            {data.comparisonGrid.map((item: any, idx: number) => (
                              <div key={idx} className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm">
                                <h3 className="text-sm font-black text-neutral-900 uppercase mb-4">{item.area}</h3>
                                {item.hasMaintenance && (
                                  <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center">
                                    <div>
                                      <p className="text-[10px] font-black uppercase text-blue-700 flex items-center gap-1.5"><Wrench size={12}/> Maintenance History</p>
                                      <p className="text-xs font-medium text-blue-900/80 italic mt-0.5">"{item.maintenanceComment}"</p>
                                    </div>
                                    <button onClick={() => router.push("/dashboard-owner/maintenance")} className="shrink-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                      <History size={14}/>
                                    </button>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Original Baseline</p>
                                    <div className="aspect-video rounded-2xl bg-neutral-50 border border-neutral-200 overflow-hidden relative">
                                      {item.baselineUrl ? (
                                        <img src={item.baselineUrl} className="w-full h-full object-cover grayscale opacity-70"/>
                                      ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-300"><ImageOff size={24}/></div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Exit Proof</p>
                                    <div className="aspect-video rounded-2xl bg-neutral-900 overflow-hidden relative shadow-inner">
                                      {item.proofUrl ? (
                                        <img src={item.proofUrl} className="w-full h-full object-cover"/>
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-white/50" size={24}/></div>
                                      )}
                                      {item.condition && (
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-lg p-2 flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Condition</span>
                                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.condition === 'Good' ? 'bg-emerald-500 text-white' : item.condition === 'Fair' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>{item.condition}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                    )}
                 </motion.div>
               )}

               {/* STEP 3: AUDIT */}
               {activeStep === 3 && (
                 <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200/60 shadow-sm">
                       <h2 className="text-xl font-black text-neutral-900 mb-6">Condition Audit</h2>
                       
                       {["notice_served", "notice_rescheduled", "notice_accepted", "photos_submitted"].includes(status) && (
                          <div className="text-center py-10">
                             <ShieldCheck className="text-neutral-300 mx-auto mb-4" size={48} />
                             <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">No Physical Audit Active</h3>
                             <p className="text-xs text-neutral-400 font-medium mt-2">You have not scheduled a physical inspector yet. If you are satisfied with the digital evidence in Step 2, you can approve directly from there.</p>
                          </div>
                       )}

                       {status === "physical_inspection_required" && (
                          <div className="bg-orange-50 border border-orange-200 p-8 rounded-2xl flex items-center gap-6">
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0"><Clock size={24}/></div>
                             <div>
                                <p className="text-sm font-black text-orange-900 uppercase">Waiting for Physical Audit</p>
                                <p className="text-xs text-orange-700 font-medium mt-1">Inspector <b>{data.exit.inspectorName}</b> is scheduled for <b>{new Date(data.exit.inspectionDate).toLocaleDateString()}</b>.</p>
                                <p className="text-[10px] text-orange-500 font-black tracking-widest uppercase mt-4">Approval Locked until tenant confirms visit</p>
                             </div>
                          </div>
                       )}

                       {status === "physical_inspection_done" && (
                          <div className="space-y-6">
                             <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl flex items-center gap-6">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0"><CheckCircle size={24}/></div>
                                <div className="flex-1">
                                   <p className="text-sm font-black text-emerald-900 uppercase">Audit Completed</p>
                                   <p className="text-xs text-emerald-700 font-medium mt-1">The physical inspection has been verified by the tenant.</p>
                                </div>
                                <button 
                                  onClick={() => handleDecision("inspection_completed")} 
                                  className="px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 bg-neutral-900 text-white shadow-md hover:bg-black transition-all shrink-0"
                                >
                                  {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Approve Final Condition
                                </button>
                             </div>
                             {/* Show comparison grid snippet for reference */}
                             <div className="mt-8 border-t border-neutral-100 pt-8">
                                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-widest mb-4">Evidence Quick Reference</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {data.comparisonGrid.map((item: any, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-xl bg-neutral-900 overflow-hidden relative shadow-sm">
                                      {item.proofUrl && <img src={item.proofUrl} className="w-full h-full object-cover"/>}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                        <span className="text-[10px] font-bold text-white truncate">{item.area}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                             </div>
                          </div>
                       )}

                       {["inspection_completed", "settled", "disputed", "payout_released", "archived"].includes(status) && (
                          <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl flex items-center gap-6">
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-neutral-900 shadow-sm shrink-0"><ShieldCheck size={24}/></div>
                             <div>
                                <p className="text-sm font-black text-neutral-900 uppercase">Condition Approved</p>
                                <p className="text-xs text-neutral-500 font-medium mt-1">The final condition of the property has been officially approved by you.</p>
                             </div>
                          </div>
                       )}
                    </div>
                 </motion.div>
               )}

               {/* STEP 4: SETTLEMENT */}
               {activeStep === 4 && (
                 <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200/60 shadow-sm">
                       <h2 className="text-xl font-black text-neutral-900 mb-6">Final Settlement</h2>
                       
                       {!["inspection_completed", "settled", "disputed", "payout_released", "archived"].includes(status) ? (
                          <div className="text-center py-10">
                             <DollarSign className="text-neutral-300 mx-auto mb-4" size={48} />
                             <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Settlement Locked</h3>
                             <p className="text-xs text-neutral-400 font-medium mt-2">You must approve the condition audit (Step 3) before the settlement ledger unlocks.</p>
                          </div>
                       ) : (
                          <div className="bg-neutral-900 p-8 rounded-2xl text-center shadow-lg relative overflow-hidden">
                             {/* Decorative background elements */}
                             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                             <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                             
                             <FileText className="text-neutral-400 mx-auto mb-6 relative z-10" size={48} />
                             <h3 className="text-2xl font-black text-white relative z-10">Settlement Ledger Unlocked</h3>
                             <p className="text-neutral-400 text-sm mt-2 max-w-md mx-auto mb-8 relative z-10">Generate the final exit breakdown, apply custom deductions, and release the deposit payout to the tenant.</p>
                             
                             <button 
                               onClick={() => router.push(`/dashboard-owner/exit/${exitId}/settlement`)}
                               className="relative z-10 bg-white text-neutral-950 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neutral-100 transition-colors shadow-xl flex items-center justify-center gap-2 mx-auto"
                             >
                               Open Settlement Portal <ArrowRight size={16}/>
                             </button>
                          </div>
                       )}
                    </div>
                 </motion.div>
               )}

            </AnimatePresence>
          </div>

        </div>

      {/* ASSIGN MODAL (Kept identical to original logic, just styled nicely) */}
      <AnimatePresence>
        {showPhysicalForm && (
          <div className="fixed inset-0 z-[100] bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowPhysicalForm(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors"><X size={20} /></button>
              <h2 className="text-xl font-black text-neutral-900 mb-6">Schedule Inspector</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1 mb-1 block">Inspection Date</label>
                  <input type="date" min={moveOutStr} max={maxInspectionStr} className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900" onChange={(e) => setForm({...form, inspectionDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1 mb-1 block">Contractor Name</label>
                  <input placeholder="e.g. John Doe" className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900" onChange={(e) => setForm({...form, inspectorName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1 mb-1 block">Contact Number</label>
                  <input placeholder="+91 9876543210" className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900" onChange={(e) => setForm({...form, inspectorContact: e.target.value})} />
                </div>
                <button onClick={() => handleDecision("physical_inspection_required")} disabled={isProcessing || !form.inspectionDate || !form.inspectorName} className="w-full py-4 bg-neutral-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-black transition-colors mt-4 disabled:opacity-50 flex justify-center items-center gap-2">
                  {isProcessing ? <Loader2 className="animate-spin" size={16}/> : 'Confirm Assignment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}