"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight, Scale, 
  Scale3d, ShieldAlert, Gavel, Loader2, ArrowRight, X, Clock, FileText, Send
} from "lucide-react";

export default function TenantDisputesPage() {
  const [activeTab, setActiveTab] = useState("raise"); // raise, active, history
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    category: "financial",
    severity: "medium",
    description: "",
    requestedAmount: ""
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Respond Modal State
  const [respondModal, setRespondModal] = useState<any>(null);
  const [respondDesc, setRespondDesc] = useState("");
  const [respondSubmitting, setRespondSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dispRes, propRes, authRes] = await Promise.all([
        fetch("/api/disputes?role=tenant"),
        fetch("/api/properties/tenant-view"),
        fetch("/api/auth/me")
      ]);
      const dispResult = await dispRes.json();
      const propResult = await propRes.json();
      const authResult = await authRes.json();
      
      if (authRes.ok && authResult.user) setCurrentUserId(authResult.user._id);
      if (dispRes.ok) setDisputes(dispResult.disputes || []);
      if (propRes.ok && propResult.property) {
        const props = [propResult.property];
        setProperties(props);
        setFormData(prev => ({ ...prev, propertyId: props[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.title || !formData.description) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requestedAmount: Number(formData.requestedAmount) || 0
        })
      });
      if (res.ok) {
        alert("Dispute raised successfully");
        setFormData({ propertyId: "", title: "", category: "financial", severity: "medium", description: "", requestedAmount: "" });
        setActiveTab("active");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondDesc || !respondModal) return;
    setRespondSubmitting(true);
    try {
      const res = await fetch("/api/disputes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: respondModal._id,
          description: respondDesc,
        })
      });
      if (res.ok) {
        alert("Counter-claim submitted successfully. Case is now under admin review.");
        setRespondModal(null);
        setRespondDesc("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRespondSubmitting(false);
    }
  };

  const activeCases = disputes.filter(d => ["open", "awaiting_respondent", "under_review_by_admin"].includes(d.status));
  const historyCases = disputes.filter(d => ["resolved", "dismissed"].includes(d.status));

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-rose-500 mb-1">
            <Scale size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Legal & Mediation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">Dispute Resolution</h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">Raise issues against property owners or respond to claims filed against you.</p>
        </div>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-px">
        {[
          { id: "raise", label: "Raise Dispute" },
          { id: "active", label: `Active Cases (${activeCases.length})` },
          { id: "history", label: "History" }
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
          
          {/* RAISE DISPUTE TAB */}
          {activeTab === "raise" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-2xs">
                <h3 className="text-lg font-black text-neutral-900 mb-6">File a New Claim</h3>
                <form onSubmit={handleRaiseDispute} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Related Property</label>
                    <select 
                      required
                      disabled
                      value={formData.propertyId} onChange={e => setFormData({...formData, propertyId: e.target.value})}
                      className="w-full bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none cursor-not-allowed text-neutral-500"
                    >
                      {properties.length === 0 && <option value="">No Active Property Found...</option>}
                      {properties.map(p => (
                        <option key={p._id} value={p._id}>{p.address}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Category</label>
                      <select 
                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900"
                      >
                        <option value="financial">Financial (Rent/Deposit)</option>
                        <option value="maintenance">Maintenance Damage</option>
                        <option value="lease_violation">Lease Violation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Severity</label>
                      <select 
                        value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical (Immediate Admin Action)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Dispute Title</label>
                    <input 
                      required type="text" placeholder="e.g. Unfair security deposit deduction"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900"
                    />
                  </div>

                  {formData.category === "financial" && (
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Requested Amount (₹)</label>
                      <input 
                        type="number" placeholder="0"
                        value={formData.requestedAmount} onChange={e => setFormData({...formData, requestedAmount: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Detailed Description</label>
                    <textarea 
                      required placeholder="Provide full context..." rows={4}
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900 resize-none"
                    />
                  </div>

                  <button 
                    type="submit" disabled={submitting}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-200"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Scale3d size={16} />}
                    Submit Claim to Admin
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ACTIVE CASES TAB */}
          {activeTab === "active" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {activeCases.length === 0 ? (
                <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-10 flex flex-col items-center text-center">
                  <ShieldAlert size={48} className="text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-neutral-600">No active disputes.</p>
                  <p className="text-xs text-neutral-400 mt-1">Your tenancy is peaceful.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeCases.map(d => {
                    const isInitiator = d.initiatorId?._id === currentUserId;
                    const canRespond = !isInitiator && d.status === "awaiting_respondent";
                    
                    return (
                      <div key={d._id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                 d.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                                 d.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-600'
                               }`}>
                                 {d.severity} Priority
                               </span>
                               <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                                 {d.status.replace(/_/g, " ")}
                               </span>
                             </div>
                             <h4 className="text-sm font-black text-neutral-900">{d.title}</h4>
                             <p className="text-[10px] font-bold text-neutral-500 uppercase">{d.propertyId?.address}</p>
                           </div>
                           <Gavel size={20} className="text-neutral-300" />
                        </div>
                        
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-4">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                            {isInitiator ? 'Your Claim' : 'Claim Against You'}
                          </p>
                          <p className="text-xs text-neutral-700 font-medium line-clamp-2">{d.initiatorClaim.description}</p>
                          {d.initiatorClaim.requestedAmount > 0 && (
                            <p className="text-xs font-black text-rose-600 mt-2">Amount Demanded: ₹{d.initiatorClaim.requestedAmount.toLocaleString()}</p>
                          )}
                        </div>
                        
                        {canRespond ? (
                          <button 
                            onClick={() => setRespondModal(d)}
                            className="w-full py-2 bg-neutral-950 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                          >
                            View Details & Respond
                          </button>
                        ) : isInitiator && d.status === "awaiting_respondent" ? (
                          <div className="w-full py-2 bg-neutral-100 text-neutral-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                            <Clock size={12}/> Awaiting Counter-Party Response
                          </div>
                        ) : (
                          <div className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                            <ShieldAlert size={12}/> Under Admin Review
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {historyCases.length === 0 ? (
                <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-10 flex flex-col items-center text-center">
                  <CheckCircle2 size={48} className="text-neutral-300 mb-3" />
                  <p className="text-sm font-bold text-neutral-600">No resolved disputes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {historyCases.map(d => (
                    <div key={d._id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                            d.adminResolution?.winner === 'initiator' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            Winner: {d.adminResolution?.winner}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-neutral-900">{d.title}</h4>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">{d.propertyId?.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Resolved</p>
                        <p className="text-xs font-bold text-neutral-900">{new Date(d.adminResolution?.resolvedAt || d.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      )}

      {/* RESPOND MODAL */}
      <AnimatePresence>
        {respondModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setRespondModal(null)} 
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-black text-neutral-900 mb-2">Respond to Claim</h3>
              <p className="text-xs text-neutral-500 font-medium mb-6">Provide your defense and any evidence to assist the Admin in mediating this dispute.</p>
              
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Claim from {respondModal.initiatorId?.name}</p>
                <p className="text-xs text-rose-900 font-medium italic">"{respondModal.initiatorClaim?.description}"</p>
                {respondModal.initiatorClaim?.requestedAmount > 0 && (
                  <p className="text-xs font-black text-rose-600 mt-2 border-t border-rose-200/50 pt-2">Demanded: ₹{respondModal.initiatorClaim.requestedAmount.toLocaleString()}</p>
                )}
              </div>

              <form onSubmit={handleRespond} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Your Counter-Claim / Defense</label>
                  <textarea 
                    required placeholder="Explain your side of the story..." rows={4}
                    value={respondDesc} onChange={e => setRespondDesc(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-neutral-900 resize-none"
                  />
                </div>
                
                <button 
                  type="submit" disabled={respondSubmitting}
                  className="w-full bg-neutral-950 hover:bg-black text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {respondSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Submit to Admin Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
