"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, CheckCircle2, AlertCircle, Camera, X, Loader2, IndianRupee, ShieldCheck, UploadCloud, Clock, Hammer, Layers, Info, Wrench
} from "lucide-react";

export default function MaintenancePage() {
  const [issues, setIssues] = useState([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isReporting, setIsReporting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<any>(null);
  const [resubmittingIssue, setResubmittingIssue] = useState<any>(null);
  const [captureTarget, setCaptureTarget] = useState<"issue" | "after">("issue");
  const [triageAlert, setTriageAlert] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reporting State
  const [roomName, setRoomName] = useState("");
  const [itemName, setItemName] = useState("");
  const [desc, setDesc] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [tempImages, setTempImages] = useState<any[]>([]);
  
  // Resolution State
  const [hasOfficialBill, setHasOfficialBill] = useState(true);
  const [workerName, setWorkerName] = useState("");
  const [workerContact, setWorkerContact] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clear states when switching modes to prevent duplication
  useEffect(() => {
    setAfterImage(""); setReceiptAmount(""); setWorkerName(""); setWorkerContact("");
  }, [hasOfficialBill]);

  useEffect(() => { 
    const init = async () => {
      await fetchPropertyStructure();
      await fetchMaintenance();
    };
    init();
  }, []);

  const fetchPropertyStructure = async () => {
    try {
      const res = await fetch(`/api/properties/tenant-view?tenantId=${localStorage.getItem("userId")}`);
      const data = await res.json();
      if (res.ok) { setProperty(data.property); setRoomName(data.property.structure[0]?.roomName || ""); }
    } catch (err) { console.error(err); }
  };

  const fetchMaintenance = async () => {
    try {
      const res = await fetch(`/api/maintenance/get?tenantId=${localStorage.getItem("userId")}`);
      const data = await res.json();
      if (res.ok) setIssues(data.issues);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const submitIssue = async () => {
    if (!roomName || !itemName || !desc || !estimatedCost || tempImages.length === 0) {
      alert("Please fill all fields and capture at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/maintenance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: localStorage.getItem("userId"),
          roomName,
          itemName,
          description: desc,
          estimatedCost,
          images: tempImages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Show triage alert with verdict
        setTriageAlert({
          responsibility: data.responsibility,
          cost: estimatedCost,
          itemName,
        });

        // Reset form
        setIsReporting(false);
        setRoomName("");
        setItemName("");
        setDesc("");
        setEstimatedCost("");
        setTempImages([]);

        // Fetch updated issues
        await fetchMaintenance();
      }
    } catch (err) {
      console.error("Issue submission failed:", err);
      alert("Failed to submit issue");
    } finally {
      setIsSubmitting(false);
    }
  };

const submitResolution = async () => {
  const issue = resolvingIssue || resubmittingIssue;
  if (!issue) return;

  try {
    const res = await fetch("/api/maintenance/action", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        issueId: issue._id, 
        action: "resolve", 
        receiptAmount,
        workerName,
        workerContact,
        hasOfficialBill,
        afterImage,
        isResubmission: !!resubmittingIssue
      })
    });

    if (res.ok) {
      setResolvingIssue(null);
      setResubmittingIssue(null);
      setAfterImage("");
      setWorkerName("");
      setWorkerContact("");
      setReceiptAmount("");
      fetchMaintenance();
    }
  } catch (err) {
    console.error("Resolution submission failed:", err);
  }
};

  const startCamera = async (target: "issue" | "after") => {
    setCaptureTarget(target);
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { setIsCapturing(false); }
  };

  const takePhoto = () => {
    const canvas = document.createElement("canvas");
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const img = canvas.toDataURL("image/jpeg", 0.7);
      if (captureTarget === "issue") setTempImages([{ url: img }]);
      else setAfterImage(img);
      stopCamera();
    }
  };

  const stopCamera = () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); setIsCapturing(false); };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  // Active Faults: Issues not yet resolved/rejected and not awaiting owner review with owner responsibility
  const active = issues.filter((i: any) => {
    if (i.status === "resolved" || i.status === "rejected") return false;
    // Include tenant_led_fix for both owner and tenant responsibility
    // Include reported (awaiting owner decision)
    if (i.status === "reported" || i.status === "tenant_led_fix") return true;
    // Include owner_led_fix only if tenant is responsible
    if (i.status === "owner_led_fix" && i.responsibility === "tenant") return true;
    return false;
  });

  // Owner-Assigned Contractors: Owner has assigned a professional (awaiting work completion)
  const ownerAssigned = issues.filter((i: any) => i.status === "owner_led_fix" && i.responsibility === "owner");

  const confirmWorkComplete = async (issueId: string) => {
    try {
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          action: "professional_work_complete"
        })
      });

      if (res.ok) {
        await fetchMaintenance();
      }
    } catch (err) {
      console.error("Failed to confirm work completion:", err);
    }
  };

  const resubmitAfterRejection = async (issueId: string) => {
    try {
      // Find the issue and load old submission data
      const issue = rejected.find((i: any) => i._id === issueId);
      if (!issue) return;

      // Pre-fill the form with old data
      setHasOfficialBill(issue.resolutionEvidence?.hasOfficialBill ?? true);
      setWorkerName(issue.resolutionEvidence?.workerName || "");
      setWorkerContact(issue.resolutionEvidence?.workerContact || "");
      setReceiptAmount(issue.finalInvoice?.amount || "");
      setAfterImage(issue.resolutionEvidence?.afterImage || "");

      // Mark as resubmitting
      setResubmittingIssue(issue);
    } catch (err) {
      console.error("Failed to load for resubmission:", err);
    }
  };

  // Pending Owner Review: Tenant submitted, waiting for owner approval (no feedback yet)
  const pending = issues.filter((i: any) => i.status === "resolved" && !i.isAmountApproved && !i.ownerFeedback && i.responsibility === "tenant");
  
  // Resubmission Required: Owner rejected with feedback, tenant needs to resubmit
  const rejected = issues.filter((i: any) => i.status === "resolved" && !i.isAmountApproved && i.ownerFeedback && i.responsibility === "tenant");
  
  // History: Approved tenant work + professional work
  const history = issues.filter((i: any) => (i.status === "resolved" && i.isAmountApproved) || (i.status === "resolved" && i.responsibility === "owner"));

  return (
    <div className="p-4 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <h1 className="text-4xl font-black text-[#1F2937]">Maintenance Vault</h1>
        <button onClick={() => setIsReporting(true)} className="bg-[#1F2937] text-white px-8 py-4 rounded-[32px] font-black text-xs uppercase shadow-xl flex items-center gap-2"><Plus size={18} /> Report Issue</button>
      </header>

      {/* TRIAGE ALERT */}
      <AnimatePresence>
        {triageAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className={`mb-12 p-6 rounded-[32px] border-2 flex items-start justify-between ${
              triageAlert.responsibility === "tenant"
                ? "bg-orange-50 border-orange-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex-1">
              <p className={`text-[11px] font-black uppercase tracking-widest ${
                triageAlert.responsibility === "tenant"
                  ? "text-orange-600"
                  : "text-blue-600"
              }`}>System Triage Verdict</p>
              <h3 className="text-lg font-black text-[#1F2937] mt-2">
                {triageAlert.responsibility === "tenant"
                  ? `Minor Repair Below ₹500 Threshold`
                  : `Major Repair - Owner Assigned`}
              </h3>
              <p className={`text-sm font-medium mt-1 ${
                triageAlert.responsibility === "tenant"
                  ? "text-orange-700"
                  : "text-blue-700"
              }`}>
                {triageAlert.responsibility === "tenant"
                  ? `This is a minor repair (₹${triageAlert.cost}). You can fix it and complete the repair at your own cost.`
                  : `This is a major repair (₹${triageAlert.cost}). The owner has been notified and will authorize the fix method.`}
              </p>
            </div>
            <button 
              onClick={() => setTriageAlert(null)}
              className="text-gray-400 hover:text-gray-600 mt-1 shrink-0"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE FAULTS */}
      <div className="space-y-8 mb-16">
        {active.map((issue: any) => (
          <div key={issue._id} className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between gap-10">
              <div className="flex-1">
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase mb-4 inline-block">{issue.status.replace(/_/g, ' ')}</span>
                
                {/* Correction Required Banner */}
                {issue.ownerFeedback && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                    <p className="text-[9px] font-black text-red-600 uppercase mb-1">Verification Dismissed</p>
                    <p className="text-sm text-red-700 font-medium">"{issue.ownerFeedback}"</p>
                  </div>
                )}

                <h3 className="text-2xl font-black text-[#1F2937]">{issue.itemName} — {issue.roomName}</h3>
                <p className="text-gray-500 mt-2 italic font-medium">"{issue.description}"</p>
                {issue.status === "tenant_led_fix" && (
                  <button onClick={() => setResolvingIssue(issue)} className="mt-8 px-10 py-4 bg-[#0D9488] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-teal-500/20 active:scale-95 transition-all">Confirm Fix & Submit Verification</button>
                )}
              </div>
              <div className="w-56 h-56 rounded-[40px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0">{issue.issueImages?.[0] && <img src={issue.issueImages[0].url} className="w-full h-full object-cover" />}</div>
          </div>
        ))}
      </div>

      {/* PENDING OWNER REVIEW */}
      {pending.length > 0 && (
        <div className="space-y-6 mb-16">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] ml-2">Awaiting Owner Audit</h2>
            {pending.map((issue: any) => (
                <div key={issue._id} className="bg-blue-50/40 p-8 rounded-[40px] border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Clock size={24}/></div>
                        <div>
                            <p className="text-sm font-black text-blue-900 uppercase">{issue.itemName} Verification</p>
                            <p className="text-[10px] text-blue-400 font-bold uppercase mt-1">Ledger Entry: ₹{issue.finalInvoice?.amount} (Pending)</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-white px-5 py-2.5 rounded-full border border-blue-50">Locked for Review</span>
                </div>
            ))}
        </div>
      )}

      {/* REJECTED SUBMISSIONS - NEED RESUBMISSION */}
      {rejected.length > 0 && (
        <div className="space-y-6 mb-16">
            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] ml-2">Resubmission Required</h2>
            {rejected.map((issue: any) => (
                <div key={issue._id} className="bg-red-50/40 p-8 rounded-[40px] border border-red-100 flex flex-col gap-6">
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest">Rejected</span>
                        </div>
                        <h3 className="text-xl font-black text-[#1F2937] uppercase tracking-tight">{issue.itemName} — {issue.roomName}</h3>
                        
                        <div className="mt-4 p-4 bg-white rounded-2xl border border-red-200">
                            <p className="text-[9px] font-black text-red-600 uppercase mb-2 flex items-center gap-2">
                                <AlertCircle size={14} /> Owner's Feedback:
                            </p>
                            <p className="text-sm text-red-700 font-medium">"{issue.ownerFeedback}"</p>
                        </div>
                        
                        <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold">Est. Cost: ₹{issue.estimatedCost}</p>
                    </div>
                    
                    <button
                      onClick={() => resubmitAfterRejection(issue._id)}
                      className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all active:scale-95"
                    >
                      Resubmit with Corrections
                    </button>
                </div>
            ))}
        </div>
      )}

      {/* OWNER-ASSIGNED CONTRACTORS */}
      {ownerAssigned.length > 0 && (
        <div className="space-y-6 mb-16">
            <h2 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] ml-2">Owner Assigned Professional</h2>
            {ownerAssigned.map((issue: any) => (
                <div key={issue._id} className="bg-purple-50/40 p-8 rounded-[40px] border border-purple-100 flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[9px] font-black uppercase tracking-widest">Professional Assigned</span>
                        </div>
                        <h3 className="text-xl font-black text-[#1F2937] uppercase tracking-tight">{issue.itemName} — {issue.roomName}</h3>
                        <p className="text-gray-500 mt-2 italic font-medium">"{issue.description}"</p>
                        
                        {/* Contractor Details Card */}
                        {issue.contractorInfo && (
                            <div className="mt-6 p-5 bg-white rounded-3xl border border-purple-200 shadow-sm">
                                <p className="text-[9px] font-black text-purple-600 uppercase mb-3 tracking-widest">Contractor Details</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Name</p>
                                        <p className="text-lg font-black text-gray-800">{issue.contractorInfo.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Contact</p>
                                        <p className="text-base font-black text-gray-800">{issue.contractorInfo.contact}</p>
                                    </div>
                                    {issue.contractorInfo.arrival && (
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Expected Arrival</p>
                                            <p className="text-base font-black text-purple-700">{issue.contractorInfo.arrival}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 tracking-widest">
                                <Wrench size={12}/> Work in progress
                            </p>
                            <button
                              onClick={() => confirmWorkComplete(issue._id)}
                              className="bg-purple-600 text-white px-6 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center gap-2 shadow-lg"
                            >
                              <CheckCircle2 size={14} />
                              Work Complete
                            </button>
                        </div>
                    </div>
                    
                    <div className="w-48 h-48 rounded-[40px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                        {issue.issueImages?.[0] && <img src={issue.issueImages[0].url} className="w-full h-full object-cover" />}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* HISTORY VAULT */}
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 ml-2">Audit History</h2>
      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
         {history.map((issue: any) => (
           <div key={issue._id} className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
             <div className="flex items-center gap-5">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${issue.status === "resolved" ? "bg-teal-50 text-[#0D9488]" : "bg-red-50 text-red-500"}`}><CheckCircle2 size={24} /></div>
               <div><p className="text-sm font-bold text-[#1F2937]">{issue.itemName}</p><p className="text-[9px] text-gray-400 uppercase font-black mt-1">Verified Cost: ₹{issue.finalInvoice?.amount || 0}</p></div>
             </div>
             <p className="text-[10px] font-black text-gray-300 uppercase">{new Date(issue.createdAt).toLocaleDateString()}</p>
           </div>
         ))}
      </div>

      {/* REPORTING MODAL */}
      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1F2937] leading-none">Report Issue</h2>
                  <p className="text-gray-400 text-sm mt-2 font-medium">Document maintenance faults in your vault.</p>
                </div>
                <button onClick={() => setIsReporting(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Room Selection */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Room</label>
                  <select 
                    value={roomName} 
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border border-gray-100 focus:border-[#0D9488]"
                  >
                    <option value="">Select room</option>
                    {property?.structure?.map((room: any, idx: number) => (
                      <option key={idx} value={room.roomName}>{room.roomName}</option>
                    ))}
                  </select>
                </div>

                {/* Item Selection */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Item/Asset</label>
                  <select 
                    value={itemName} 
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border border-gray-100 focus:border-[#0D9488]"
                  >
                    <option value="">Select item</option>
                    {roomName && property?.structure?.find((r: any) => r.roomName === roomName)?.items?.map((item: any, idx: number) => (
                      <option key={idx} value={item.itemName}>{item.itemName}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Issue Description</label>
                  <textarea 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border border-gray-100 focus:border-[#0D9488] resize-none h-20"
                    placeholder="What's wrong?"
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 flex items-center gap-2">
                    <IndianRupee size={12} /> Estimated Cost
                  </label>
                  <input 
                    type="number" 
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-black text-emerald-600 outline-none border border-gray-100 focus:border-[#0D9488]"
                    placeholder="0"
                  />
                </div>

                {/* Image Capture */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Damage Photos</label>
                  <button 
                    onClick={() => startCamera("issue")}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center gap-2 text-gray-400 hover:text-[#0D9488] transition-all"
                  >
                    {tempImages.length > 0 ? (
                      <>
                        <div className="flex gap-2">
                          {tempImages.map((img, idx) => (
                            <img key={idx} src={img.url} className="h-12 w-12 object-cover rounded-lg" />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase">{tempImages.length} Photo(s) Captured</span>
                      </>
                    ) : (
                      <>
                        <Camera size={32} />
                        <span className="text-[10px] font-black uppercase">Capture Issue Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => setIsReporting(false)}
                  className="flex-1 py-4 text-gray-400 font-bold text-[10px] uppercase hover:text-gray-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitIssue}
                  disabled={isSubmitting || !roomName || !itemName || !desc || !estimatedCost || tempImages.length === 0}
                  className="flex-[2] py-5 bg-[#1F2937] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESOLUTION MODAL */}
      <AnimatePresence>
        {(resolvingIssue || resubmittingIssue) && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl">
              <h2 className="text-2xl font-black text-[#1F2937] mb-2 leading-none">{resubmittingIssue ? "Resubmit Evidence" : "Repair Finalization"}</h2>
              <p className="text-gray-400 text-sm mb-10 font-medium tracking-tight">{resubmittingIssue ? "Address the feedback and resubmit corrected evidence." : "Provide verification for reimbursement protocol."}</p>

              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button onClick={() => setHasOfficialBill(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${hasOfficialBill ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}>Official Bill</button>
                  <button onClick={() => setHasOfficialBill(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!hasOfficialBill ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}>Local Worker</button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><IndianRupee size={12}/> Amount Paid</label>
                  <input type="number" className="w-full p-5 bg-gray-50 rounded-2xl font-black text-emerald-600 outline-none" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)}/>
                </div>

                {!hasOfficialBill && (
                  <div className="grid grid-cols-2 gap-4">
                    <input className="p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none" placeholder="Worker Name" value={workerName} onChange={(e) => setWorkerName(e.target.value)}/>
                    <input className="p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none" placeholder="Phone" value={workerContact} onChange={(e) => setWorkerContact(e.target.value)}/>
                  </div>
                )}

                <button onClick={() => startCamera("after")} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center gap-2 text-gray-400 hover:text-[#0D9488] transition-all">
                  {afterImage ? <img src={afterImage} className="h-16 w-16 object-cover rounded-xl" /> : <Camera size={32}/>}
                  <span className="text-[10px] font-black uppercase">{afterImage ? "Evidence Secured" : "Capture Verification Photo"}</span>
                </button>

                {resubmittingIssue && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                    <p className="text-[9px] text-orange-700 font-black uppercase mb-2">Previous Feedback:</p>
                    <p className="text-xs text-orange-700">"{resubmittingIssue.ownerFeedback}"</p>
                  </div>
                )}

                {(resolvingIssue || resubmittingIssue)?.responsibility === 'tenant' && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <p className="text-xs text-orange-800 font-medium">You're completing this repair at your own cost per the threshold agreement. Submit your evidence for documentation.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-12">
                <button onClick={() => { setResolvingIssue(null); setResubmittingIssue(null); }} className="flex-1 py-4 text-gray-400 font-bold text-[10px] uppercase">Cancel</button>
                <button onClick={submitResolution} disabled={!receiptAmount || !afterImage} className="flex-[2] py-5 bg-[#1F2937] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl disabled:opacity-50">{resubmittingIssue ? "Resubmit" : "Seal & Submit"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCapturing && (
          <div className="fixed inset-0 z-[300] bg-black flex flex-col p-6">
            <div className="flex justify-between items-center text-white mb-6"><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Vault Camera</h3><button onClick={stopCamera} className="p-3 bg-white/10 rounded-full"><X size={20} /></button></div>
            <div className="flex-1 rounded-[48px] overflow-hidden bg-gray-900 border border-white/5 relative"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /><div className="absolute bottom-10 left-0 right-0 flex justify-center"><button onClick={takePhoto} className="w-24 h-24 bg-white rounded-full border-[10px] border-white/20 active:scale-90 transition-all" /></div></div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}