"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, CheckCircle2, AlertCircle, ChevronRight, 
  Camera, X, Loader2, User, Phone, Calendar, Wrench,
  Layers, Hammer, IndianRupee, ShieldCheck
} from "lucide-react";

export default function MaintenancePage() {
  const [issues, setIssues] = useState([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Robust Form State
  const [roomName, setRoomName] = useState("");
  const [itemName, setItemName] = useState("");
  const [desc, setDesc] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [tempImages, setTempImages] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { 
    const init = async () => {
      await fetchPropertyStructure();
      await fetchMaintenance();
    };
    init();
  }, []);

  const fetchPropertyStructure = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/properties/tenant-view?tenantId=${userId}`);
      const data = await res.json();
      if (res.ok && data.property) {
        setProperty(data.property);
        setRoomName(data.property.structure[0]?.roomName || "");
      }
    } catch (err) { console.error("Structure fetch failed:", err); }
  };

  const fetchMaintenance = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/maintenance/get?tenantId=${userId}`);
      const data = await res.json();
      if (res.ok) setIssues(data.issues);
    } catch (err) { console.error("Fetch failed:", err); }
    finally { setLoading(false); }
  };

  const handleResolve = async (issueId: string, action: string) => {
    const res = await fetch("/api/maintenance/action", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, action })
    });
    if (res.ok) fetchMaintenance();
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsCapturing(false);
  };

  const takePhoto = () => {
    const canvas = document.createElement("canvas");
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      setTempImages([{ url: canvas.toDataURL("image/jpeg") }]); // Module 3 focuses on single clear evidence
      stopCamera();
    }
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/maintenance/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: localStorage.getItem("userId"),
        roomName,
        itemName,
        description: desc,
        estimatedCost: Number(estimatedCost),
        images: tempImages
      })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Issue Fingerprinted. System Triage: ${data.responsibility.toUpperCase()} is responsible.`);
      setIsReporting(false);
      setDesc("");
      setEstimatedCost("");
      setTempImages([]);
      fetchMaintenance();
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#0D9488]" size={32} />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synchronizing Maintenance Vault...</p>
    </div>
  );

  // Cascading dropdown logic
  const availableItems = property?.structure.find((r: any) => r.roomName === roomName)?.items || [];

  return (
    <div className="p-4 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1F2937] tracking-tight">Maintenance Portal</h1>
          <p className="text-gray-400 font-medium mt-2">Smart Triage: Rule-based responsibility assignment.</p>
        </div>
        <button onClick={() => setIsReporting(true)} className="bg-[#1F2937] text-white px-8 py-4 rounded-3xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center gap-2">
          <Plus size={20} /> Report Digital Evidence
        </button>
      </header>

      {/* 🚀 ACTIVE REQUESTS SECTION */}
      <div className="mb-12">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 ml-2">Active Maintenance Ledger</h2>
        <div className="space-y-6">
          {issues.filter((i: any) => !i.status.startsWith("resolved") && i.status !== "rejected").length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-gray-100 rounded-[48px] bg-white/50">
               <Wrench size={40} className="mx-auto text-gray-200 mb-4" />
               <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">No Active Faults Detected</p>
            </div>
          ) : (
            issues.filter((i: any) => !i.status.startsWith("resolved") && i.status !== "rejected").map((issue: any) => (
              <motion.div layout key={issue._id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest">{issue.status.replace(/_/g, " ")}</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            issue.responsibility === 'owner' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                            Responsibility: {issue.responsibility}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#1F2937] mt-4">{issue.itemName} — {issue.roomName}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed font-medium italic">"{issue.description}"</p>

                    {/* ✅ DISPLAYING CONTRACTOR DETAILS */}
                    {issue.status === "contractor_assigned" && issue.contractorInfo && (
                      <div className="mt-8 p-6 bg-blue-50/30 rounded-[32px] border border-blue-100/50">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Assigned Professional</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><User size={18}/></div>
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Contractor</p><p className="text-sm font-bold text-blue-900">{issue.contractorInfo.name || "Fixer Assigned"}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Phone size={18}/></div>
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Direct Contact</p><p className="text-sm font-bold text-blue-900">{issue.contractorInfo.contact || "Pending"}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Calendar size={18}/></div>
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">ETA</p><p className="text-sm font-bold text-blue-900">{issue.contractorInfo.arrival || "Checking Schedule"}</p></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex flex-wrap gap-4">
                      {issue.status === "tenant_led_fix" && (
                        <button 
                          onClick={() => handleResolve(issue._id, "resolve_by_tenant")} 
                          className="bg-[#0D9488] text-white px-8 py-4 rounded-2xl font-bold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all uppercase tracking-widest"
                        >
                          Mark as Fixed & Upload Receipt
                        </button>
                      )}
                      {issue.status === "contractor_assigned" && (
                        <button 
                          onClick={() => handleResolve(issue._id, "resolve_by_contractor")} 
                          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest"
                        >
                          Confirm Professional Resolved Issue
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-56 h-56 rounded-[48px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0 shadow-sm grayscale-[30%] hover:grayscale-0 transition-all">
                    {issue.issueImages?.[0] && <img src={issue.issueImages[0].url} className="w-full h-full object-cover" alt="Evidence" />}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 📜 REPAIR HISTORY SECTION */}
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 ml-2">Resolved Proof Vault</h2>
      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
         {issues.filter((i: any) => i.status.startsWith("resolved") || i.status === "rejected").length === 0 ? (
           <p className="p-10 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">No past entries recorded.</p>
         ) : (
           issues.filter((i: any) => i.status.startsWith("resolved") || i.status === "rejected").map((issue: any) => (
             <div key={issue._id} className="p-6 border-b border-gray-50 flex justify-between items-center hover:bg-gray-50 transition-colors group last:border-none">
               <div className="flex items-center gap-5">
                 {issue.status.startsWith("resolved") ? (
                   <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0D9488] shadow-sm"><CheckCircle2 size={24} /></div>
                 ) : (
                   <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm"><AlertCircle size={24} /></div>
                 )}
                 <div>
                   <p className="text-sm font-bold text-[#1F2937] group-hover:text-blue-600 transition-colors">{issue.itemName} — {issue.roomName}</p>
                   <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1">
                     {issue.status.replace(/_/g, " ")} • Responsibility: {issue.responsibility}
                   </p>
                 </div>
               </div>
               <div className="text-right shrink-0">
                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(issue.createdAt).toLocaleDateString()}</p>
                 <ChevronRight size={16} className="text-gray-200 mt-1 ml-auto group-hover:text-blue-400 transition-all" />
               </div>
             </div>
           ))
         )}
      </div>

      {/* 📷 ROBUST REPORTING MODAL */}
      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[48px] p-10 shadow-2xl overflow-hidden relative">
              <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="font-black text-2xl text-[#1F2937] tracking-tight">Report Asset Fault</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Triage Protocol Module 3</p>
                </div>
                <button onClick={() => setIsReporting(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all"><X size={24}/></button>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5"><Layers size={12}/> Select Room</label>
                        <select 
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)} 
                            className="w-full p-5 bg-gray-50 rounded-2xl text-sm font-black border-none outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                            {property?.structure.map((r: any) => <option key={r.roomName} value={r.roomName}>{r.roomName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5"><Hammer size={12}/> Specific Item</label>
                        <select 
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full p-5 bg-gray-50 rounded-2xl text-sm font-black border-none outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                            <option value="">Select Item...</option>
                            {availableItems.map((it: any) => <option key={it.itemName} value={it.itemName}>{it.itemName}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5"><IndianRupee size={12}/> Estimated Repair Cost</label>
                  <input 
                    type="number" 
                    placeholder="Approx cost for repair..." 
                    className="w-full p-5 bg-gray-50 rounded-2xl text-sm font-black border-none outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                  <p className="text-[9px] text-blue-500 font-bold ml-2">*Triage Threshold: ₹{property?.maintenanceRules.repairThreshold || 500}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Description of Fault</label>
                  <textarea placeholder="e.g. The tap is leaking from the base when turned on..." className="w-full p-5 bg-gray-50 rounded-2xl text-sm h-32 outline-none border-none resize-none font-bold" onChange={(e) => setDesc(e.target.value)} />
                </div>
                
                <div className="flex gap-4 items-end">
                  <button onClick={startCamera} className="flex-1 py-8 border-2 border-dashed border-gray-200 rounded-[32px] text-gray-400 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all group">
                    <Camera size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capture Evidence</span>
                  </button>
                  {tempImages.length > 0 && (
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl rotate-3">
                      <img src={tempImages[0].url} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={!desc || !itemName || tempImages.length === 0} 
                className="w-full mt-10 py-5 bg-[#1F2937] text-white rounded-3xl font-black shadow-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                Launch Smart Triage
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📹 LIVE TRIAGE VIEWFINDER */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black flex flex-col p-6">
            <div className="flex justify-between items-center text-white mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Evidence Viewfinder</h3>
              </div>
              <button onClick={stopCamera} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 rounded-[48px] overflow-hidden border border-white/5 relative bg-gray-900 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
                 <button onClick={takePhoto} className="w-24 h-24 bg-white rounded-full border-[10px] border-white/20 shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-black/5" />
                </button>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Hold Steady to Capture Damage</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}