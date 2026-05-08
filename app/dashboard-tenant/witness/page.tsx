"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, ShieldCheck, Lock, CheckCircle2, AlertCircle, X, 
  Loader2, Zap, ChevronRight, Clock, FileText
} from "lucide-react";

export default function DigitalWitness() {
  const [property, setProperty] = useState<any>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [auditReport, setAuditReport] = useState<any[]>([]);
  const [currentRoomIdx, setCurrentRoomIdx] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeItem, setActiveItem] = useState<{room: string, item: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const propRes = await fetch(`/api/properties/tenant-view?tenantId=${userId}`);
        const propData = await propRes.json();
        setProperty(propData.property);

        const insRes = await fetch(`/api/inspections/get?tenantId=${userId}&type=move-in`);
        const insData = await insRes.json();
        setInspection(insData.inspection);

        // Initialize audit report from property structure
        if (propData.property?.structure) {
          const initialReport: any[] = [];
          propData.property.structure.forEach((room: any) => {
            room.items.forEach((item: any) => {
              initialReport.push({
                roomName: room.roomName,
                itemName: item.itemName,
                condition: "Good",
                photoUrl: null
              });
            });
          });
          setAuditReport(initialReport);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const startCamera = (room: string, item: string) => {
    setActiveItem({ room, item });
    setIsCapturing(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !activeItem) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const imgData = canvas.toDataURL("image/jpeg", 0.7);

    setAuditReport(prev => prev.map(record => 
      (record.roomName === activeItem.room && record.itemName === activeItem.item)
      ? { ...record, photoUrl: imgData } : record
    ));

    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    setIsCapturing(false);
    setActiveItem(null);
  };

  const updateCondition = (room: string, item: string, condition: string) => {
    setAuditReport(prev => prev.map(record => 
      (record.roomName === room && record.itemName === item)
      ? { ...record, condition } : record
    ));
    if (condition !== "Good") startCamera(room, item);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await fetch("/api/inspections/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: localStorage.getItem("userId"), report: auditReport })
    });
    if (res.ok) window.location.reload();
    else setIsSubmitting(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  // ✅ 1. STATUS GATE: PENDING OR VERIFIED
  if (inspection && (inspection.status === "pending" || inspection.status === "verified")) {
    return (
      <div className="p-6 md:p-16 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl ${
          inspection.status === 'verified' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white animate-pulse'
        }`}>
          {inspection.status === 'verified' ? <Lock size={40} /> : <Clock size={40} />}
        </div>
        
        <h1 className="text-3xl font-black text-[#1F2937] mb-4">
          {inspection.status === 'verified' ? "Baseline Audit Secured" : "Verification in Progress"}
        </h1>
        <p className="text-gray-400 max-w-md mb-10 leading-relaxed">
          {inspection.status === 'verified' 
            ? "Your property state is now cryptographically locked. This evidence will be used during your move-out settlement."
            : "Your itemized report has been sent to the owner for verification. You will be notified once the vault is officially locked."}
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
           <div className="p-6 bg-white border border-gray-100 rounded-3xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items Audited</p>
              <p className="text-xl font-black text-gray-800">{inspection.report?.length || 0}</p>
           </div>
           <div className="p-6 bg-white border border-gray-100 rounded-3xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <p className={`text-sm font-black uppercase ${inspection.status === 'verified' ? 'text-emerald-500' : 'text-blue-600'}`}>{inspection.status}</p>
           </div>
        </div>
      </div>
    );
  }

  // ✅ 2. AUDIT FLOW (Visible if no inspection or Rejected)
  const currentRoom = property.structure[currentRoomIdx];
  const itemsInCurrentRoom = auditReport.filter(r => r.roomName === currentRoom.roomName);
  const isRoomComplete = itemsInCurrentRoom.every(item => item.condition === "Good" || (item.condition !== "Good" && item.photoUrl));

  return (
    <div className="p-6 md:p-16 max-w-4xl mx-auto pb-40">
      <header className="mb-12">
        <div className="flex items-center gap-2 text-[#0D9488] mb-2 font-black uppercase text-[10px] tracking-widest">
          <ShieldCheck size={16} /> Module 2: Baseline Protocol
        </div>
        <h1 className="text-4xl font-black text-[#1F2937]">Room-by-Room Audit</h1>
        <p className="text-gray-400 mt-2">Verify condition of each asset to protect your deposit.</p>
      </header>

      {/* 🛑 REJECTION FEEDBACK */}
      {inspection?.status === "rejected" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div>
            <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Audit Retake Required</h4>
            <p className="text-sm text-red-700/70 mt-1">Owner Feedback: "{inspection.ownerFeedback}"</p>
          </div>
        </motion.div>
      )}

      {/* 🟢 PROGRESS BAR */}
      <div className="flex gap-2 mb-10">
        {property.structure.map((_: any, i: number) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentRoomIdx ? 'bg-[#0D9488]' : 'bg-gray-100'}`} />
        ))}
      </div>

      <motion.div 
        key={currentRoomIdx}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-gray-100 rounded-[48px] p-8 md:p-12 shadow-sm"
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-[#1F2937]">{currentRoom.roomName}</h2>
          <span className="px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {currentRoomIdx + 1} of {property.structure.length}</span>
        </div>

        <div className="space-y-8">
          {currentRoom.items.map((item: any, idx: number) => {
            const reportItem = auditReport.find(r => r.roomName === currentRoom.roomName && r.itemName === item.itemName);
            return (
              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div>
                  <h3 className="font-bold text-[#1F2937]">{item.itemName}</h3>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter mt-1">Initial State: {item.baselineCondition}</p>
                </div>

                <div className="flex items-center gap-3">
                  {["Good", "Fair", "Poor"].map((cond) => (
                    <button
                      key={cond}
                      onClick={() => updateCondition(currentRoom.roomName, item.itemName, cond)}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        reportItem?.condition === cond 
                        ? 'bg-[#1F2937] text-white shadow-lg' 
                        : 'bg-white border border-gray-100 text-gray-400'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                  
                  {reportItem?.photoUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm">
                      <img src={reportItem.photoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-50">
          <button 
            disabled={currentRoomIdx === 0}
            onClick={() => setCurrentRoomIdx(prev => prev - 1)}
            className="text-sm font-bold text-gray-400 disabled:opacity-0"
          >
            Back
          </button>
          
          {currentRoomIdx === property.structure.length - 1 ? (
            <button 
              disabled={!isRoomComplete || isSubmitting}
              onClick={handleSubmit}
              className="px-10 py-5 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black disabled:opacity-50 transition-all flex items-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalize Audit <CheckCircle2 size={18} /></>}
            </button>
          ) : (
            <button 
              disabled={!isRoomComplete}
              onClick={() => setCurrentRoomIdx(prev => prev + 1)}
              className="px-10 py-5 bg-[#0D9488] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 transition-all flex items-center gap-3"
            >
              Next Room <ChevronRight size={18} />
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isCapturing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex flex-col p-6">
             <div className="flex justify-between items-center text-white mb-6">
                <p className="text-xs font-black uppercase tracking-widest">Evidence: {activeItem?.item}</p>
                <button onClick={() => setIsCapturing(false)} className="p-3 bg-white/10 rounded-full"><X size={20} /></button>
             </div>
             <div className="flex-1 bg-gray-900 rounded-[40px] overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                   <button onClick={takePhoto} className="w-24 h-24 bg-white rounded-full border-[10px] border-white/20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-2 border-black/5" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}