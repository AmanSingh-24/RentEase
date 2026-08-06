"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wrench, CheckCircle, XCircle, Loader2,
  RefreshCw, MapPin, Camera, AlertCircle, 
  Briefcase, Phone, Clock, ShieldCheck, 
  Archive, FileText, User, BadgeCheck
} from "lucide-react";

type MaintenanceTab = "triage" | "progress" | "verification" | "archive";

export default function MaintenanceQueue() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MaintenanceTab>("triage");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cArrival, setCArrival] = useState("");

  const [disputeIssue, setDisputeIssue] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [verifyingWorker, setVerifyingWorker] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/maintenance/get-for-owner?ownerId=${localStorage.getItem("userId")}`
      );
      const data = await res.json();
      if (res.ok) setIssues(data.issues || []);
      else showToast(data.error || "Failed to load issues", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (issueId: string, action: string) => {
    setActionLoading(issueId + action);
    try {
      const body: any = { issueId, action };
      if (action === "approve_contractor") {
        body.contractorName = cName;
        body.contractorContact = cPhone;
        body.arrival = cArrival;
      }
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("Action completed successfully", "success");
        setSelectedIssue(null);
        setCName("");
        setCPhone("");
        setCArrival("");
        await fetchQueue();
      } else {
        showToast("Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyResolution = async (issueId: string) => {
    setActionLoading(issueId + "verify");
    try {
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, action: "verify_and_archive" })
      });
      if (res.ok) {
        showToast("Resolution verified & archived", "success");
        await fetchQueue(); 
      } else {
        showToast("Verification failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisputeVerification = async (issueId: string) => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for dismissal");
      return;
    }
    setActionLoading(issueId + "dispute");
    try {
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          issueId, 
          action: "dispute_verification",
          feedback: disputeReason
        })
      });
      if (res.ok) {
        showToast("Resolution rejected", "success");
        setDisputeIssue(null);
        setDisputeReason("");
        await fetchQueue();
      } else {
        showToast("Rejection failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyWorker = async (issueId: string) => {
    setActionLoading(issueId + "verifyworker");
    try {
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, action: "verify_worker" })
      });
      if (res.ok) {
        showToast("Worker verified", "success");
        setVerifyingWorker(null);
        await fetchQueue();
      } else {
        showToast("Verification failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const actionable = issues.filter((i: any) => i.status === "reported");
  const inProgress = issues.filter((i: any) => 
    i.status === "owner_led_fix" || 
    i.status === "tenant_led_fix" ||
    (i.status === "resolved" && !i.isAmountApproved && i.ownerFeedback)
  );
  const verificationQueue = issues.filter((i: any) => {
    const isTenantFix = i.responsibility === "tenant";
    const isOwnerDelegatedTenantFix = i.responsibility === "owner" && i.resolutionEvidence?.afterImage;
    return i.status === "resolved" && !i.isAmountApproved && !i.ownerFeedback && (isTenantFix || isOwnerDelegatedTenantFix);
  });
  const history = issues.filter((i: any) => {
    if (i.status === "resolved" && i.isAmountApproved) return true;
    if (i.status === "resolved" && i.responsibility === "owner" && !i.resolutionEvidence?.afterImage) return true;
    return false;
  });

  const getFilteredList = () => {
    if (activeTab === "triage") return actionable;
    if (activeTab === "progress") return inProgress;
    if (activeTab === "verification") return verificationQueue;
    return history;
  };

  const filteredList = getFilteredList();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl text-white transition-all duration-300 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight mb-1">
            Maintenance Dashboard
          </h1>
          <p className="text-xs text-neutral-500 font-medium max-w-2xl">
            Triage new issues, track ongoing repairs, and audit resolved tasks across your portfolio.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all shadow-2xs active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Status
        </button>
      </div>

      {/* ── Status Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
        {[
          { id: "triage", label: "Triage Needed", count: actionable.length },
          { id: "progress", label: "In Progress", count: inProgress.length },
          { id: "verification", label: "Verification", count: verificationQueue.length },
          { id: "archive", label: "Archived", count: history.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MaintenanceTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-950 hover:bg-white/50"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-neutral-950 text-white" : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Requests List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neutral-950" size={32} />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
          <Wrench size={40} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900 mb-1">
            No {activeTab} issues
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Everything looks clean here. Enjoy the peace of mind.
          </p>
        </div>
      ) : (
        <div className={activeTab === "archive" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
          {filteredList.map((issue) => {
            const isProcessing = actionLoading?.startsWith(issue._id);
            const propId = typeof issue.propertyId === 'object' ? issue.propertyId : null;

            if (activeTab === "archive") {
              return (
                <div key={issue._id} className="bg-white rounded-3xl border border-neutral-200/85 shadow-2xs overflow-hidden flex flex-col p-5">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200">
                      {issue.issueImages?.[0]?.url ? (
                        <img src={issue.issueImages[0].url} alt={issue.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300"><Camera size={18}/></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-sm leading-tight">{issue.itemName}</h4>
                      <p className="text-[10px] text-neutral-500 font-bold mt-0.5">{issue.roomName}</p>
                      {propId && (
                         <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide flex items-center gap-1 mt-1">
                            <MapPin size={10} /> {propId.address || "Asset"}
                         </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5 mb-5 text-[10px]">
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                      <p className="text-neutral-400 font-bold uppercase tracking-wide mb-1">Status</p>
                      <p className="font-extrabold text-neutral-800 capitalize">{issue.status?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                      <p className="text-neutral-400 font-bold uppercase tracking-wide mb-1">Responsibility</p>
                      <p className="font-extrabold text-neutral-800 capitalize">{issue.responsibility}</p>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                      <p className="text-neutral-400 font-bold uppercase tracking-wide mb-1">Causation</p>
                      <p className="font-extrabold text-neutral-800 capitalize">{issue.causation?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                      <p className="text-neutral-400 font-bold uppercase tracking-wide mb-1">Final Cost</p>
                      <p className="font-black text-neutral-900 text-xs">₹{issue.finalInvoice?.amount || issue.estimatedCost || 0}</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <span className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-xl font-bold text-[10px] uppercase w-full">
                       <BadgeCheck size={14} /> Audited & Closed
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={issue._id}
                className="bg-white rounded-2xl border border-neutral-200/85 shadow-2xs overflow-hidden p-5"
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  
                  {/* Left: Images & Info */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200">
                      {issue.issueImages?.[0]?.url ? (
                        <img src={issue.issueImages[0].url} alt={issue.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300"><Camera size={20}/></div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-neutral-900 text-sm leading-tight">{issue.itemName}</p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {issue.causation?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-bold">in {issue.roomName}</p>
                      {propId && (
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide flex items-center gap-1">
                           <MapPin size={10} /> {propId.address || "Asset"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Details specific to tab */}
                  <div className="flex-1 space-y-3 flex flex-col justify-center">
                    
                    {activeTab === "triage" && (
                       <div className="text-xs text-neutral-600 border-l-2 border-neutral-200 pl-3">
                         <p className="italic">"{issue.description}"</p>
                         <p className="font-bold text-neutral-800 mt-2">Tenant Estimate: ₹{issue.estimatedCost}</p>
                       </div>
                    )}

                    {activeTab === "progress" && (
                       <div className="text-xs">
                          {issue.status === "owner_led_fix" && issue.contractorInfo && (
                            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl space-y-1">
                               <p className="font-bold text-neutral-800">Professional Dispatched</p>
                               <p className="text-neutral-600">Contractor: {issue.contractorInfo.name} ({issue.contractorInfo.contact})</p>
                               <p className="text-neutral-500">Expected: {new Date(issue.contractorInfo.arrival).toLocaleString()}</p>
                            </div>
                          )}
                          {issue.status === "tenant_led_fix" && (
                            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
                               <p className="font-bold text-neutral-800">Tenant Self-Fixing</p>
                               <p className="text-neutral-600">Awaiting tenant to submit resolution and invoice.</p>
                            </div>
                          )}
                          {issue.ownerFeedback && (
                            <div className="mt-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-800">
                              <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14}/> Resolution Rejected</p>
                              <p className="italic mt-1">"{issue.ownerFeedback}"</p>
                            </div>
                          )}
                       </div>
                    )}

                    {activeTab === "verification" && (
                       <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
                               <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Final Cost</p>
                               <p className="text-lg font-black text-neutral-900">₹{issue.finalInvoice?.amount || 0}</p>
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
                               <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Category</p>
                               <p className="text-sm font-bold text-neutral-800">{issue.resolutionEvidence?.repairCategory || "Other"}</p>
                            </div>
                         </div>
                         <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl flex items-center justify-between gap-2">
                            <div>
                               <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Transaction ID</p>
                               <p className="text-sm font-bold text-neutral-800">{issue.finalInvoice?.transactionId || "N/A"}</p>
                            </div>
                            {issue.finalInvoice?.url && (
                              <a href={issue.finalInvoice.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold uppercase bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0">
                                <FileText size={12} /> View Proof
                              </a>
                            )}
                         </div>
                       </div>
                    )}

                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col lg:items-end justify-center gap-2 lg:w-[220px] flex-shrink-0">
                    
                    {activeTab === "triage" && selectedIssue !== issue._id && (
                      <>
                        <button
                          disabled={!!isProcessing}
                          onClick={() => handleAction(issue._id, "tenant_fix")}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl font-bold text-xs shadow-3xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          Delegate to Tenant
                        </button>
                        <button
                          disabled={!!isProcessing}
                          onClick={() => setSelectedIssue(issue._id)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Briefcase size={14} /> Dispatch Pro
                        </button>
                      </>
                    )}

                    {activeTab === "triage" && selectedIssue === issue._id && (
                       <div className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl space-y-2 shadow-sm">
                          <input placeholder="Pro Name" className="w-full p-2 text-xs border border-neutral-200 rounded-lg outline-none" value={cName} onChange={(e)=>setCName(e.target.value)} />
                          <input placeholder="Pro Phone" className="w-full p-2 text-xs border border-neutral-200 rounded-lg outline-none" value={cPhone} onChange={(e)=>setCPhone(e.target.value)} />
                          <input type="datetime-local" className="w-full p-2 text-xs border border-neutral-200 rounded-lg outline-none text-neutral-500" value={cArrival} onChange={(e)=>setCArrival(e.target.value)} />
                          <div className="flex gap-2 pt-1">
                            <button onClick={()=>setSelectedIssue(null)} className="flex-1 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800">Cancel</button>
                            <button 
                              onClick={()=>handleAction(issue._id, "approve_contractor")} 
                              disabled={!cName || !cPhone || !cArrival || !!isProcessing} 
                              className="flex-[2] py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                            >
                              Assign
                            </button>
                          </div>
                       </div>
                    )}

                    {activeTab === "progress" && (
                      <span className="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-500 rounded-xl font-bold text-[10px] uppercase w-full">
                         <Clock size={14} /> Pending Resolution
                      </span>
                    )}

                    {activeTab === "verification" && (
                      <>
                        {issue.resolutionEvidence?.workerName && !issue.resolutionEvidence.workerVerified && (
                           <button
                             onClick={() => setVerifyingWorker(issue._id)}
                             className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-[10px] uppercase shadow-3xs transition-all mb-1"
                           >
                             Verify Contact
                           </button>
                        )}
                        <button
                          disabled={!!isProcessing}
                          onClick={() => handleVerifyResolution(issue._id)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                          Approve
                        </button>
                        <button
                          disabled={!!isProcessing}
                          onClick={() => setDisputeIssue(issue._id)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-neutral-600 rounded-xl font-bold text-xs shadow-3xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISMISS REJECTION MODAL */}
      {disputeIssue && (
        <div className="fixed inset-0 z-[100] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] p-6 shadow-2xl border border-neutral-200">
            <h2 className="text-xl font-black text-neutral-900 mb-1">Reject Evidence</h2>
            <p className="text-xs text-neutral-500 font-medium mb-5">Provide feedback so the tenant can correct their submission.</p>

            <textarea 
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full p-3 bg-neutral-50 rounded-xl text-xs border border-neutral-200 focus:border-neutral-400 outline-none resize-none h-28 mb-5 font-medium"
              placeholder="e.g., The receipt photo is blurry..."
            />

            <div className="flex gap-3">
              <button onClick={() => { setDisputeIssue(null); setDisputeReason(""); }} className="flex-1 py-2.5 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleDisputeVerification(disputeIssue)} disabled={!disputeReason.trim()} className="flex-[2] py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">Send Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* WORKER VERIFICATION MODAL */}
      {verifyingWorker && (
        <div className="fixed inset-0 z-[100] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] p-6 shadow-2xl border border-neutral-200">
            <h2 className="text-xl font-black text-neutral-900 mb-1">Verify Worker</h2>
            <p className="text-xs text-neutral-500 font-medium mb-5">Confirm worker details before authorizing the rent credit.</p>

            {verificationQueue.find(i => i._id === verifyingWorker) && (
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 mb-5">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Local Pro Details</p>
                <p className="font-extrabold text-neutral-900 text-sm">{verificationQueue.find(i => i._id === verifyingWorker)?.resolutionEvidence?.workerName}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{verificationQueue.find(i => i._id === verifyingWorker)?.resolutionEvidence?.workerContact}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setVerifyingWorker(null)} className="flex-1 py-2.5 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleVerifyWorker(verifyingWorker)} className="flex-[2] py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-black rounded-xl">Confirm Verified</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}