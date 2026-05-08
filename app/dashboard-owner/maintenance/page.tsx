"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, CheckCircle2, AlertCircle, MapPin, User, 
  Loader2, Phone, Calendar, XCircle, ShieldAlert,
  ArrowRight, Info, Hammer
} from "lucide-react";

export default function MaintenanceQueue() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Form State for Contractor Assignment
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cArrival, setCArrival] = useState("");

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/maintenance/get-for-owner?ownerId=${localStorage.getItem("userId")}`);
      const data = await res.json();
      if (res.ok) setIssues(data.issues);
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (issueId: string, action: string) => {
    // ⚖️ Logic: approve_contractor -> owner_led_fix, tenant_fix -> tenant_led_fix
    const feedback = action === "reject" ? prompt("Reason for rejection?") : null;
    if (action === "reject" && !feedback) return;

    const res = await fetch("/api/maintenance/action", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        issueId, 
        action, // "approve_contractor", "tenant_fix", "reject"
        contractorName: cName, 
        contractorContact: cPhone, 
        arrivalDesc: cArrival,
        feedback 
      })
    });

    if (res.ok) {
      setSelectedIssue(null);
      setCName(""); setCPhone(""); setCArrival("");
      fetchQueue();
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Maintenance Vault...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-[#1F2937] tracking-tight">Maintenance Triage</h1>
        <p className="text-gray-400 font-medium mt-2">Manage portfolio repairs and system-assigned responsibilities.</p>
      </header>

      <div className="space-y-8 mb-20">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Active Action Items</h2>
        
        {issues.filter((i: any) => i.status === "reported" || i.status === "owner_led_fix" || i.status === "tenant_led_fix").map((issue: any) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={issue._id} className="bg-white rounded-[48px] border border-gray-100 p-10 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex flex-col lg:flex-row gap-10">
              
              {/* 📸 DAMAGE EVIDENCE */}
              <div className="w-full lg:w-64 h-64 rounded-[40px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0 relative">
                {issue.issueImages?.[0] ? (
                    <img src={issue.issueImages[0].url} className="w-full h-full object-cover" alt="Evidence" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><AlertCircle size={40}/></div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-red-500 shadow-sm">Damage Captured</div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">{issue.status.replace(/_/g, " ")}</span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                        issue.responsibility === 'owner' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                        <ShieldAlert size={12}/> Responsibility: {issue.responsibility}
                    </span>
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">Est. ₹{issue.estimatedCost}</span>
                </div>

                <h3 className="text-2xl font-black text-[#1F2937] leading-tight">{issue.itemName} — {issue.roomName}</h3>
                <p className="text-gray-500 mt-4 leading-relaxed font-medium">"{issue.description}"</p>
                
                <div className="mt-6 flex items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> {issue.propertyId.address}</span>
                    <span className="flex items-center gap-2"><User size={14} className="text-emerald-500"/> {issue.tenantId.name}</span>
                </div>

                {/* 🛠️ ACTION: ASSIGN CONTRACTOR FORM */}
                <AnimatePresence>
                    {selectedIssue === issue._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-10 p-8 bg-gray-50 rounded-[32px] space-y-6 border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2 text-[#0052CC]">
                            <Hammer size={16}/>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Assignment Protocol</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="Contractor Name" className="p-5 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-200 transition-all" onChange={e => setCName(e.target.value)} />
                            <input placeholder="Phone Number" className="p-5 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-200 transition-all" onChange={e => setCPhone(e.target.value)} />
                            <input placeholder="Arrival Time (e.g. Mon 10AM)" className="p-5 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-200 transition-all" onChange={e => setCArrival(e.target.value)} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleAction(issue._id, "approve_contractor")} className="flex-1 bg-[#1F2937] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all">Deploy Professional</button>
                            <button onClick={() => setSelectedIssue(null)} className="px-8 py-5 text-gray-400 font-bold text-xs uppercase">Cancel</button>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
              </div>

              <div className="lg:w-72 flex flex-col gap-4 justify-center lg:border-l lg:pl-10 border-gray-100">
                {issue.status === "reported" && (
                  <>
                    <button onClick={() => setSelectedIssue(issue._id)} className="w-full py-5 bg-[#0052CC] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Authorize Pro</button>
                    <button onClick={() => handleAction(issue._id, "tenant_fix")} className="w-full py-5 bg-white border border-gray-200 text-[#1F2937] rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">Tenant-Led Fix</button>
                  </>
                )}
                
                {issue.status !== "reported" && (
                    <div className="p-6 bg-blue-50 rounded-[32px] text-center">
                        <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={20}/>
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Awaiting Fix Confirmation</p>
                    </div>
                )}

                <button onClick={() => handleAction(issue._id, "reject")} className="mt-4 text-[10px] font-black text-red-400 uppercase tracking-[0.2em] hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                    <XCircle size={14}/> Decline Request
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📜 RESOLVED LOG SECTION */}
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 ml-2">Historical Records</h2>
      <div className="bg-white rounded-[48px] border border-gray-100 overflow-hidden shadow-sm">
         {issues.filter((i: any) => i.status === "resolved" || i.status === "rejected").length === 0 ? (
            <div className="p-16 text-center">
                <Info size={32} className="mx-auto text-gray-200 mb-4"/>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No historical data available</p>
            </div>
         ) : (
            issues.filter((i: any) => i.status === "resolved" || i.status === "rejected").map((issue: any) => (
                <div key={issue._id} className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20 group hover:bg-gray-50 transition-colors last:border-none">
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                            issue.status === "resolved" ? "bg-teal-50 text-[#0D9488]" : "bg-red-50 text-red-500"
                        }`}>
                            {issue.status === "resolved" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                        </div>
                        <div>
                            <p className="text-sm font-black text-[#1F2937] uppercase tracking-tight">{issue.itemName} — {issue.roomName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                {issue.propertyId.address} • Responsibility: {issue.responsibility}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(issue.createdAt).toLocaleDateString()}</p>
                        <p className={`text-[9px] font-black uppercase mt-1 ${issue.status === "resolved" ? "text-teal-600" : "text-red-400"}`}>
                            Status: {issue.status}
                        </p>
                    </div>
                </div>
            ))
         )}
      </div>
    </div>
  );
}