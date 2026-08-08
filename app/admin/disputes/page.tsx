"use client";

import { useState, useEffect } from "react";
import { Scale, Loader2, ArrowRight, CheckCircle2, ShieldAlert, Gavel, XCircle, Clock } from "lucide-react";

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/disputes?role=admin");
      const result = await res.json();
      if (res.ok) setDisputes(result.disputes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string, winner: string, decisionNotes: string) => {
    if (!decisionNotes) {
      alert("Decision notes are required to resolve a dispute.");
      return;
    }
    setResolving(disputeId);
    try {
      const res = await fetch("/api/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, winner, decisionNotes })
      });
      if (res.ok) {
        alert("Dispute successfully resolved.");
        fetchDisputes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(null);
    }
  };

  const activeCases = disputes.filter(d => ["open", "awaiting_respondent", "under_review_by_admin"].includes(d.status));
  const historyCases = disputes.filter(d => ["resolved", "dismissed"].includes(d.status));

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-500 mb-1">
            <Scale size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Supreme Mediation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">Admin Dispute Portal</h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">Review evidence and issue binding financial resolutions.</p>
        </div>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-px">
        {[
          { id: "active", label: `Active Cases (${activeCases.length})` },
          { id: "history", label: `Resolved History (${historyCases.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab.id ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
         <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={32} />
         </div>
      ) : (
        <div className="pt-4">
          
          {/* ACTIVE CASES TAB */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {activeCases.length === 0 ? (
                <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-10 flex flex-col items-center text-center">
                  <ShieldAlert size={48} className="text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-neutral-600">No active cases to review.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeCases.map(d => (
                    <div key={d._id} className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
                      <div className="bg-neutral-950 p-4 flex justify-between items-center text-white">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                               d.severity === 'critical' ? 'bg-rose-500' : 'bg-neutral-700'
                             }`}>
                               {d.severity} Priority
                             </span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                               {d.category.replace("_", " ")}
                             </span>
                           </div>
                           <h4 className="text-base font-black">{d.title}</h4>
                           <p className="text-xs font-medium text-neutral-400 mt-1">{d.propertyId?.address}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Status</p>
                           <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase tracking-widest">
                             {d.status.replace(/_/g, " ")}
                           </span>
                         </div>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Initiator */}
                         <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Initiator Claim</p>
                                <p className="text-sm font-bold text-neutral-900 mt-1">{d.initiatorId?.name} ({d.initiatorId?.role})</p>
                              </div>
                              {d.initiatorClaim.requestedAmount > 0 && (
                                <p className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-1 rounded">Demand: ₹{d.initiatorClaim.requestedAmount.toLocaleString()}</p>
                              )}
                           </div>
                           <p className="text-xs text-neutral-700 leading-relaxed bg-white p-3 rounded-lg border border-neutral-200">{d.initiatorClaim.description}</p>
                         </div>

                         {/* Respondent */}
                         <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Respondent Counter-Claim</p>
                                <p className="text-sm font-bold text-neutral-900 mt-1">{d.respondentId?.name} ({d.respondentId?.role})</p>
                              </div>
                           </div>
                           {d.respondentClaim?.description ? (
                             <p className="text-xs text-neutral-700 leading-relaxed bg-white p-3 rounded-lg border border-neutral-200">{d.respondentClaim.description}</p>
                           ) : (
                             <p className="text-xs font-bold text-neutral-400 italic flex items-center gap-2">
                               <Clock size={12}/> Awaiting response from {d.respondentId?.role}...
                             </p>
                           )}
                         </div>
                      </div>

                      {/* Admin Action Panel */}
                      {d.status === "under_review_by_admin" && (
                        <div className="border-t border-neutral-200 bg-blue-50/50 p-6">
                          <h4 className="text-sm font-black text-blue-950 uppercase tracking-widest mb-4 flex items-center gap-2"><Gavel size={16}/> Issue Judgment</h4>
                          
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleResolve(d._id, formData.get("winner") as string, formData.get("notes") as string);
                          }} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Select Winner</label>
                              <select name="winner" className="w-full md:w-64 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
                                <option value="initiator">Rule for Initiator ({d.initiatorId?.name})</option>
                                <option value="respondent">Rule for Respondent ({d.respondentId?.name})</option>
                                <option value="split">Split / Compromise</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Official Decision Notes & Ledger Action</label>
                              <textarea name="notes" required rows={3} placeholder="Explain the ruling. This is visible to both parties." className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-blue-500 resize-none"/>
                            </div>
                            
                            <button disabled={resolving === d._id} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md">
                              {resolving === d._id ? <Loader2 size={14} className="animate-spin"/> : <Scale3d size={14}/>} Execute Resolution
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {historyCases.map(d => (
                <div key={d._id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-neutral-900">{d.title}</h4>
                    <p className="text-[10px] font-bold text-neutral-500 mt-0.5 uppercase tracking-widest">
                      Winner: <span className="text-emerald-600">{d.adminResolution?.winner}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-2 italic border-l-2 border-neutral-200 pl-2">"{d.adminResolution?.decisionNotes}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Resolved</p>
                    <p className="text-xs font-bold text-neutral-900">{new Date(d.adminResolution?.resolvedAt || d.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
