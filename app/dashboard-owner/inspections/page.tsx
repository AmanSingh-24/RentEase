"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, CheckCircle2, XCircle, Eye, 
  MessageSquare, Loader2, Calendar, User, Camera, AlertCircle 
} from "lucide-react";

export default function OwnerInspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const ownerId = localStorage.getItem("userId");
      const res = await fetch(`/api/inspections/get-for-owner?ownerId=${ownerId}`);
      const data = await res.json();
      if (res.ok) setInspections(data.inspections);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: string, action: "verify" | "reject") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/inspections/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: id, action, feedback })
      });
      if (res.ok) {
        setSelectedInspection(null);
        fetchInspections(); // Refresh list without full page reload
      }
    } catch (err) { alert("Vault communication failed."); }
    finally { setIsProcessing(false); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scanning Move-In Vaults...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 lg:p-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <ShieldCheck size={20} />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Audit Management</span>
        </div>
        <h1 className="text-4xl font-black text-[#1F2937] tracking-tight">Digital Witness Review</h1>
        <p className="text-gray-400 mt-2 font-medium">Verify tenant-captured evidence to lock the property state.</p>
      </header>

      <div className="grid gap-6">
        {inspections.length === 0 ? (
          <div className="p-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
            <CheckCircle2 size={40} className="text-gray-200 mb-4" />
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">All properties are currently verified</p>
          </div>
        ) : (
          inspections.map((ins: any) => (
            <motion.div 
              key={ins._id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-[#0052CC] shadow-sm">
                  <Camera size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] text-xl">{ins.propertyId.address}</h3>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <User size={12} className="text-blue-500"/> {ins.tenantId.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} className="text-emerald-500"/> Submitted {new Date(ins.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInspection(ins)}
                className="mt-6 md:mt-0 px-8 py-4 bg-[#1F2937] text-white rounded-2xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Eye size={16} /> Review Evidence ({ins.report?.length || 0})
              </button>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedInspection && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-5xl rounded-[48px] overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
              <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-black text-[#1F2937]">Move-In Baseline Evidence</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest">{selectedInspection.propertyId.address}</p>
                </div>
                <button onClick={() => setSelectedInspection(null)} className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black transition-all shadow-sm">
                   <XCircle size={24} />
                </button>
              </div>

<div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
  {/* ✅ Check if report exists and has items */}
  {selectedInspection.report && selectedInspection.report.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {selectedInspection.report.map((item: any, i: number) => (
        <div key={i} className="group relative bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100 shadow-sm flex flex-col">
          <div className="aspect-video relative bg-gray-200">
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-[10px] uppercase tracking-widest bg-gray-100">
                No Photo (Marked Good)
              </div>
            )}
            
            {/* 🏷️ Item Labels */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-600 shadow-sm border border-white">
              {item.roomName} • {item.itemName}
            </div>

            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white ${
              item.condition === 'Good' ? 'bg-emerald-500 text-white' : 
              item.condition === 'Fair' ? 'bg-orange-400 text-white' : 'bg-red-500 text-white'
            }`}>
              {item.condition}
            </div>
          </div>
          {item.tenantComment && (
            <div className="p-4 bg-white border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tenant Note:</p>
              <p className="text-xs text-gray-600 italic">"{item.tenantComment}"</p>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    /* ❌ Fallback if report is empty */
    <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
        <AlertCircle size={32} />
      </div>
      <div>
        <p className="text-lg font-bold text-[#1F2937]">Incompatible Audit Data</p>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">This inspection was submitted using an older version of the app and lacks structured room data.</p>
      </div>
    </div>
  )}
</div>

              <div className="p-10 bg-white border-t border-gray-50 space-y-6">
                <div className="relative">
                  <MessageSquare className="absolute left-5 top-5 text-gray-300" size={18} />
                  <textarea 
                    placeholder="Provide feedback for the tenant (required if requesting a retake)..."
                    className="w-full p-5 pl-14 rounded-3xl border border-gray-100 bg-gray-50/30 outline-none focus:bg-white focus:border-blue-500 text-sm resize-none transition-all h-24"
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedInspection._id, "reject")}
                    className="flex-1 py-5 border-2 border-red-50 text-red-500 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <XCircle size={18} /> Request Retake
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedInspection._id, "verify")}
                    className="flex-[1.5] py-5 bg-[#0D9488] text-white rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-[#0A7A6F] transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle2 size={18} /> Verify & Lock Vault</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}