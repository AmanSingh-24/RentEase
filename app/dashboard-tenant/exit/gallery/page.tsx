"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Camera, Check, ArrowRight, Loader2, X, RefreshCw, 
  AlertCircle, ImageOff, Zap, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MoveOutGallery() {
  const [slots, setSlots] = useState<any[]>([]);
  const [uploads, setUploads] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [exitId, setExitId] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ index: number; name: string } | null>(null);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
const initialize = async () => {
  try {
    const tenantId = localStorage.getItem("userId");
    
    // 1. Get the Active Exit Process directly (Source of Truth)
    const exitRes = await fetch(`/api/exit/get-status?tenantId=${tenantId}`);
    const exitData = await exitRes.json();
    
    if (!exitRes.ok || !exitData.exit) {
      setError("No active exit process found. Please serve notice first.");
      return;
    }
    
    // ✅ SUCCESS: We have the Exit ID directly from the record
    setExitId(exitData.exit._id);

    // 2. Now get the property details using the ID inside the exit record
    const propId = exitData.exit.propertyId;
    const propRes = await fetch(`/api/properties/get-by-tenant?tenantId=${tenantId}`);
    const propData = await propRes.json();
    
    if (propRes.ok && propData.property) {
      const property = propData.property;

      // 3. Fetch Baseline
      const moveInRes = await fetch(`/api/inspections/get-move-in?propertyId=${property._id}`);
      const moveInData = await moveInRes.json();

      if (moveInRes.ok && moveInData.report?.length > 0) {
        setSlots(moveInData.report.map((item: any) => ({
          category: `${item.roomName}: ${item.itemName}`,
          url: item.photoUrl,
        })));
      } else {
        // Fallback to structure labels
        const structuralSlots: any[] = [];
        property.structure.forEach((room: any) => {
          room.items.forEach((item: any) => {
            structuralSlots.push({ category: `${room.roomName}: ${item.itemName}`, url: null });
          });
        });
        setSlots(structuralSlots);
      }
    }
  } catch (err) {
    setError("System synchronization failed.");
  } finally {
    setLoading(false);
  }
};
    initialize();
  }, []);

  // 🛠️ TEST MODE: Auto-fills all slots with a tiny placeholder image
  const autoFillForTesting = () => {
    const testData: { [key: number]: string } = {};
    slots.forEach((_, index) => {
      testData[index] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    });
    setUploads(testData);
  };

  const startCamera = async (index: number, category: string) => {
    setActiveSlot({ index, name: category });
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || activeSlot === null) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640; // Compressed width
    canvas.height = 480; // Compressed height
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imgData = canvas.toDataURL("image/jpeg", 0.6); // 60% quality to prevent 'Payload Too Large'
      setUploads(prev => ({ ...prev, [activeSlot.index]: imgData }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    setActiveSlot(null);
  };

  const handleSubmit = async () => {
    if (!exitId) return alert("System Error: activeExitId missing.");
    setIsSubmitting(true);

    // ✅ FIX: Match the exact schema { area, url }
    const photoArray = slots.map((slot, index) => ({
      area: slot.category,
      url: uploads[index] || ""
    }));

    try {
      const res = await fetch("/api/exit/submit-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          exitId: exitId, 
          photos: photoArray 
        })
      });

      if (res.ok) {
        // Success: Redirect to pending state
        window.location.href = "/dashboard-tenant/exit";
      } else {
        const err = await res.json();
        alert(`Vault Rejection: ${err.error}`);
      }
    } catch (err) {
      alert("Network Error: Payload may be too large. Try taking fewer photos or lower resolution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Mapping Property Structure...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto pb-40">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#1F2937] tracking-tighter italic">Condition Audit</h1>
          <p className="text-gray-400 mt-2 font-medium">Verify current state for all <span className="text-black font-bold">{slots.length} items</span>.</p>
        </div>
        
        {/* 🛠️ TEST BUTTON */}
        <button 
          onClick={autoFillForTesting}
          className="px-6 py-3 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-lg active:scale-95"
        >
          <Zap size={14}/> Test Mode: Auto-Fill
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {slots.map((item: any, index: number) => (
          <div key={index} className="bg-white border border-gray-100 rounded-[48px] p-8 md:p-10 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-black uppercase mb-8 tracking-tight flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold">{index + 1}</span>
               {item.category}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Baseline Reference */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vault Baseline (Move-In)</p>
                {item.url ? (
                  <img src={item.url} className="w-full h-64 object-cover rounded-[32px] grayscale opacity-40 border border-gray-50 shadow-inner" alt="Baseline" />
                ) : (
                  <div className="w-full h-64 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                    <ImageOff size={32} />
                    <p className="text-[8px] font-black uppercase mt-2 tracking-widest">No Record Found</p>
                  </div>
                )}
              </div>
              
              {/* Current Evidence */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Current Proof (Exit)</p>
                {uploads[index] ? (
                  <div className="relative rounded-[32px] overflow-hidden border-4 border-emerald-50 shadow-xl group">
                    <img src={uploads[index]} className="w-full h-64 object-cover" alt="Proof" />
                    <button 
                      onClick={() => startCamera(index, item.category)} 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest"
                    >
                      <RefreshCw size={20} className="mb-2"/> <br/> Retake Capture
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => startCamera(index, item.category)} 
                    className="w-full h-64 border-4 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Camera size={28} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Open Camera</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || Object.keys(uploads).length < slots.length}
          className="w-full py-8 bg-[#1F2937] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-20 active:scale-95"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><ShieldCheck size={20} /> Submit Full Audit Report</>}
        </button>
      </div>

      {/* 📸 CAMERA OVERLAY */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div className="fixed inset-0 z-[100] bg-black flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-8 flex justify-between items-center text-white z-10">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <h3 className="font-bold uppercase tracking-[0.2em] text-[10px]">Live Audit: {activeSlot?.name}</h3>
              </div>
              <button onClick={stopCamera} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={28} /></button>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[0.5px] border-white/10 pointer-events-none grid grid-cols-3 grid-rows-3">
                 {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/5" />)}
              </div>
            </div>
            
            <div className="h-44 bg-black flex flex-col items-center justify-center relative">
               <button 
                 onClick={capturePhoto} 
                 className="w-24 h-24 bg-white rounded-full border-[8px] border-gray-800 shadow-2xl active:scale-90 transition-all flex items-center justify-center"
               >
                 <div className="w-16 h-16 rounded-full border-2 border-black/5" />
               </button>
               <p className="mt-4 text-[8px] font-black uppercase text-white/30 tracking-[0.4em]">Tap to Capture Condition</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}