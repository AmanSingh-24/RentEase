"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, AlertTriangle, Loader2, ShieldCheck, 
  X, Calendar, User, Phone, ArrowRight, DollarSign, ImageOff, 
  Wrench, History, ExternalLink, Clock, HardHat, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/exit/get-comparison?exitId=${exitId}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
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
          // Final approval: Push back to main
          router.push("/dashboard-owner/exit");
        } else {
          // Physical assign: Stay here and show new state
          setShowPhysicalForm(false);
          await fetchData();
        }
      }
    } finally { setIsProcessing(false); }
  };

  if (loading || !data || !data.exit) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const status = data.exit.status;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-10 max-w-7xl mx-auto pb-40 space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#1F2937] tracking-tight italic">Condition Review</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'photos_submitted' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
               Current State: {status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          {/* ASSIGN PROFESSIONAL BUTTON */}
          <button 
            disabled={status !== "photos_submitted" || isProcessing}
            onClick={() => setShowPhysicalForm(true)} 
            className={`px-8 py-5 rounded-[24px] font-bold text-xs flex items-center gap-2 border transition-all ${
              status === "photos_submitted" ? "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100" : "bg-gray-50 text-gray-400 border-gray-100 opacity-50"
            }`}
          >
            <HardHat size={16}/> {status === 'physical_inspection_required' ? "Inspector Assigned" : "Assign Professional"}
          </button>

          {/* APPROVE CONDITION BUTTON */}
          <button 
            disabled={(status !== "photos_submitted" && status !== "physical_inspection_done") || isProcessing}
            onClick={() => handleDecision("inspection_completed")} 
            className={`px-8 py-5 rounded-[24px] font-bold text-xs flex items-center gap-2 shadow-xl transition-all ${
              (status === "photos_submitted" || status === "physical_inspection_done") ? "bg-[#1F2937] text-white hover:bg-black" : "bg-gray-100 text-gray-300 opacity-50"
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
            Approve Final Condition
          </button>
        </div>
      </header>

      {/* 🚧 STATUS BANNERS */}
      {status === "physical_inspection_required" && (
        <div className="bg-orange-50 border border-orange-200 p-8 rounded-[40px] flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><Clock size={24}/></div>
              <div>
                <p className="text-sm font-black text-orange-900 uppercase">Waiting for Physical Audit</p>
                <p className="text-xs text-orange-700">Inspector <b>{data.exit.inspectorName}</b> is scheduled for <b>{new Date(data.exit.inspectionDate).toLocaleDateString()}</b>.</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Approval Locked</p>
              <p className="text-[9px] text-orange-600 italic">Unlocks after tenant confirms visit.</p>
           </div>
        </div>
      )}

      {status === "physical_inspection_done" && (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[40px] flex items-center gap-6 animate-in fade-in zoom-in duration-500">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm"><CheckCircle size={24}/></div>
           <div>
              <p className="text-sm font-black text-emerald-900 uppercase">In-Person Audit Completed</p>
              <p className="text-xs text-emerald-700">The physical inspection has been verified. You can now approve the final condition.</p>
           </div>
        </div>
      )}

      {/* WAITING FOR TENANT SCREEN */}
      {status === "notice_accepted" && (
        <div className="bg-white border border-gray-100 p-16 rounded-[56px] text-center shadow-xl flex flex-col items-center justify-center">
           <Camera className="text-gray-300 mb-6" size={64} />
           <h2 className="text-3xl font-black text-[#1F2937]">Waiting for Tenant Evidence</h2>
           <p className="text-gray-400 mt-2 italic max-w-md">The 7-day digital witness window is open. The tenant must upload their move-out photos and condition reports before you can inspect the vault.</p>
        </div>
      )}

      {/* COMPARISON GRID */}
      {status !== "notice_accepted" && (
      <div>
        <div className="flex gap-2 mb-8">
          <button onClick={() => setFilter("all")} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${filter === "all" ? "bg-[#1F2937] text-white shadow-lg" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>All Items</button>
          <button onClick={() => setFilter("maintenance")} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${filter === "maintenance" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>Maintenance Only</button>
        </div>
        <div className="grid grid-cols-1 gap-12">
          {data.comparisonGrid.filter((i: any) => filter === "all" || i.hasMaintenance).map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-10 rounded-[56px] border border-gray-100 relative overflow-hidden group">
              {item.hasMaintenance && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white p-6 rounded-bl-[40px] z-10 max-w-sm shadow-xl">
                  <div className="flex items-center gap-2 mb-2"><Wrench size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Maintenance History</span></div>
                  <p className="text-xs italic text-blue-100 font-medium">"{item.maintenanceComment}"</p>
                </div>
              )}
            <h3 className="text-lg font-black text-[#1F2937] uppercase mb-8">{item.area}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Original Baseline</p>
                <div className="aspect-video rounded-[40px] bg-gray-50 border flex flex-col items-center justify-center overflow-hidden">
                  {item.baselineUrl ? (
                    <img src={item.baselineUrl} className="w-full h-full object-cover grayscale opacity-60"/>
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      <ImageOff size={32} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Original Photo</p>
                      <p className="text-xs mt-2 font-bold text-gray-500">Logged Condition: <span className={`${item.baselineCondition === 'Good' ? 'text-emerald-500' : item.baselineCondition === 'Fair' ? 'text-orange-500' : 'text-red-500'}`}>{item.baselineCondition || "Good"}</span></p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Exit Proof</p>
                  {item.condition && (
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${item.condition === 'Good' ? 'bg-emerald-100 text-emerald-600' : item.condition === 'Fair' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>Condition: {item.condition}</span>
                  )}
                </div>
                <div className="aspect-video rounded-[40px] bg-gray-900 overflow-hidden shadow-2xl border-4 border-white">{item.proofUrl ? <img src={item.proofUrl} className="w-full h-full object-cover"/> : <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32}/></div>}</div>
              </div>
            </div>
            {item.hasMaintenance && (
              <button onClick={() => router.push("/dashboard-owner/maintenance")} className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-colors">
                <History size={14}/> View Item Maintenance history <ExternalLink size={12}/>
              </button>
            )}
          </div>
        ))}
      </div>
      </div>
      )}

      {/* ASSIGN MODAL */}
      <AnimatePresence>
        {showPhysicalForm && (
          <div className="fixed inset-0 z-[100] bg-[#1F2937]/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[56px] p-12 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowPhysicalForm(false)} className="absolute top-10 right-10 text-gray-300 hover:text-black transition-colors"><X size={24} /></button>
              <h2 className="text-3xl font-black mb-8 tracking-tight italic">Schedule Inspector</h2>
              <div className="space-y-4">
                <input type="date" min={today} className="w-full p-5 bg-gray-50 rounded-2xl font-bold" onChange={(e) => setForm({...form, inspectionDate: e.target.value})} />
                <input placeholder="Contractor Name" className="w-full p-5 bg-gray-50 rounded-2xl font-bold" onChange={(e) => setForm({...form, inspectorName: e.target.value})} />
                <input placeholder="Contact Number" className="w-full p-5 bg-gray-50 rounded-2xl font-bold" onChange={(e) => setForm({...form, inspectorContact: e.target.value})} />
                <button onClick={() => handleDecision("physical_inspection_required")} className="w-full py-6 bg-orange-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-100 mt-6">Confirm Assignment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}