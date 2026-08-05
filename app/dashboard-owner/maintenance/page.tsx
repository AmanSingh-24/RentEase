"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  User,
  Loader2,
  IndianRupee,
  FileText,
  Info,
  ShieldCheck,
  XCircle,
  Hammer,
  AlertTriangle,
  BadgeCheck,
  Clock,
  Camera
} from "lucide-react";

export default function MaintenanceQueue() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cArrival, setCArrival] = useState("");

  // Dispute Loop States
  const [disputeIssue, setDisputeIssue] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  
  // Worker Verification State
  const [verifyingWorker, setVerifyingWorker] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(
        `/api/maintenance/get-for-owner?ownerId=${localStorage.getItem(
          "userId"
        )}`
      );

      const data = await res.json();

      if (res.ok) {
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

// 1. Updated Verification Function
const handleVerifyResolution = async (issueId: string) => {
  try {
    const res = await fetch("/api/maintenance/action", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        issueId, 
        action: "verify_and_archive" 
      })
    });
    
    if (res.ok) {
      // Force a re-fetch to move the item to history immediately
      await fetchQueue(); 
    }
  } catch (err) {
    console.error("Verification failed:", err);
  }
};

  const handleAction = async (issueId: string, action: string) => {
    try {
      const body: any = {
        issueId,
        action,
      };

      if (action === "approve_contractor") {
        body.contractorName = cName;
        body.contractorContact = cPhone;
        body.arrival = cArrival;
      }

      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSelectedIssue(null);
        setCName("");
        setCPhone("");
        setCArrival("");
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispute Resolution Handler
  const handleDisputeVerification = async (issueId: string) => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for dismissal");
      return;
    }

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
        setDisputeIssue(null);
        setDisputeReason("");
        await fetchQueue();
      }
    } catch (err) {
      console.error("Dispute failed:", err);
    }
  };

  // Worker Verification Handler
  const handleVerifyWorker = async (issueId: string) => {
    try {
      const res = await fetch("/api/maintenance/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          issueId, 
          action: "verify_worker"
        })
      });
      
      if (res.ok) {
        setVerifyingWorker(null);
        await fetchQueue();
      }
    } catch (err) {
      console.error("Worker verification failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  // Direct Actions Required: Only initial reported items
  const actionable = issues.filter((i: any) =>
    i.status === "reported"
  );

  // Property Logs: Silent notifications for minor tenant-led repairs (tenant responsibility)
  const silentLogs = issues.filter(
    (i: any) => i.status === "tenant_led_fix" && i.responsibility === "tenant"
  );

  // Verification Queue: Tenant-submitted evidence awaiting owner approval
  // Does NOT include items waiting for tenant resubmission (those have ownerFeedback)
  const verificationQueue = issues.filter(
    (i: any) => i.status === "resolved" && !i.isAmountApproved && !i.ownerFeedback && i.responsibility === "tenant"
  );

  // Waiting for Response: Items rejected by owner, waiting for tenant resubmission
  const waitingForResponse = issues.filter(
    (i: any) => i.status === "resolved" && !i.isAmountApproved && i.ownerFeedback && i.responsibility === "tenant"
  );

  // History: Approved tenant work + professional work
  const history = issues.filter(
    (i: any) =>
      (i.status === "resolved" && i.isAmountApproved) ||
      (i.status === "resolved" && i.responsibility === "owner") // Professional work goes here
  );

  return (
    <div className="p-4 md:p-10 lg:p-12 max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="mb-12">
        <h1 className="text-4xl font-black text-[#1F2937] tracking-tight">
          Portfolio Maintenance
        </h1>
      </header>

      <div className="space-y-16">
        {/* ACTION REQUIRED */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">
            Direct Actions Required
          </h2>

          {actionable.length === 0 && (
            <p className="p-10 text-center text-gray-300 text-xs font-black uppercase">
              No active faults
            </p>
          )}

          {actionable.map((issue: any) => (
            <motion.div
              key={issue._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[48px] border border-gray-100 p-10 shadow-sm flex flex-col lg:flex-row gap-10"
            >
              {/* IMAGE */}
              <div className="w-56 h-56 rounded-[40px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                {issue.issueImages?.[0] && (
                  <img
                    src={issue.issueImages[0].url}
                    alt="Issue"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {issue.status.replace(/_/g, " ")}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                      issue.responsibility === "owner"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    System Assigned: {issue.responsibility}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight">
                  {issue.itemName} — {issue.roomName}
                </h3>

                <p className="text-gray-500 mt-2 font-medium">
                  "{issue.description}"
                </p>

                {/* CONTRACTOR FORM */}
                {selectedIssue === issue._id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl"
                  >
                    <input
                      placeholder="Contractor Name"
                      className="p-4 bg-white rounded-2xl text-xs font-bold border-none outline-none"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                    />

                    <input
                      placeholder="Worker Contact"
                      className="p-4 bg-white rounded-2xl text-xs font-bold border-none outline-none"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                    />

                    <input
                      placeholder="Expected Arrival"
                      type="datetime-local"
                      className="p-4 bg-white rounded-2xl text-xs font-bold border-none outline-none"
                      value={cArrival}
                      onChange={(e) => setCArrival(e.target.value)}
                    />

                    <button
                      onClick={() =>
                        handleAction(issue._id, "approve_contractor")
                      }
                      disabled={!cName || !cPhone || !cArrival}
                      className="bg-[#1F2937] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Authorize Fixer
                    </button>
                  </motion.div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="lg:w-64 flex flex-col gap-3 justify-center lg:border-l lg:pl-10 border-gray-100">
                {issue.status === "reported" && (
                  <>
                    <button
                      onClick={() => setSelectedIssue(issue._id)}
                      className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      Assign Professional
                    </button>

                    <button
                      onClick={() =>
                        handleAction(issue._id, "tenant_fix")
                      }
                      className="w-full py-4 bg-white border border-gray-200 text-[#1F2937] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      Tenant-Led Fix
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        {/* PROPERTY LOGS - Silent Notifications */}
        {silentLogs.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] ml-2">
              Quiet Log (Minor Repairs)
            </h2>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
              {silentLogs.map((issue: any) => (
                <div
                  key={issue._id}
                  className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20 last:border-none hover:bg-gray-50/40 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <Hammer size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1F2937] uppercase tracking-tight">
                        {issue.itemName} — {issue.roomName}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                        Tenant-Led Fix • Est. ₹{issue.estimatedCost}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WAITING FOR RESPONSE - Rejected & Awaiting Resubmission */}
        {waitingForResponse.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] ml-2">
              Awaiting Tenant Resubmission
            </h2>

            {waitingForResponse.map((issue: any) => (
              <motion.div
                key={issue._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-orange-50/40 rounded-[48px] border border-orange-200 p-10 shadow-sm flex flex-col lg:flex-row gap-10"
              >
                {/* IMAGE */}
                <div className="w-56 h-56 rounded-[40px] bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                  {issue.issueImages?.[0] && (
                    <img
                      src={issue.issueImages[0].url}
                      alt="Issue"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Awaiting Resubmission
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight">
                    {issue.itemName} — {issue.roomName}
                  </h3>

                  <div className="mt-6 p-4 bg-white rounded-2xl border border-orange-200">
                    <p className="text-[9px] font-black text-orange-600 uppercase mb-2 flex items-center gap-2">
                      <AlertTriangle size={14} /> Your Rejection Reason:
                    </p>
                    <p className="text-sm text-gray-700 font-medium">"{issue.ownerFeedback}"</p>
                  </div>

                  <p className="text-[10px] text-gray-400 uppercase mt-4 font-bold">
                    Previously Submitted: ₹{issue.finalInvoice?.amount}
                  </p>
                </div>

                {/* INFO */}
                <div className="lg:w-64 flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                    <Clock size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Tenant Resubmitting
                  </p>
                </div>
              </motion.div>
            ))}
          </section>
        )}

        {/* VERIFICATION QUEUE */}
        {verificationQueue.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] ml-2">
              Verification Queue (Tenant-Submitted Evidence)
            </h2>

            {verificationQueue.map((issue: any) => (
              <motion.div
                key={issue._id}
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                className="bg-emerald-50/20 p-10 rounded-[48px] border-2 border-dashed border-emerald-200 flex flex-col xl:flex-row gap-10 relative overflow-hidden"
              >
                {/* IMAGES */}
<div className="flex gap-4 shrink-0">
    <div className="space-y-2">
        <p className="text-[8px] font-black text-gray-400 uppercase text-center">Initial Fault</p>
        <div className="w-40 h-40 rounded-3xl bg-white overflow-hidden border border-gray-100">
            {issue.issueImages?.[0]?.url ? (
              <img src={issue.issueImages[0].url} className="w-full h-full object-cover grayscale-[40%]" alt="Before" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><Camera size={32}/></div>
            )}
        </div>
    </div>
    <div className="space-y-2">
        <p className="text-[8px] font-black text-emerald-600 uppercase text-center">Resolution Proof</p>
        <div className="w-40 h-40 rounded-3xl bg-emerald-100 overflow-hidden border-2 border-emerald-400 shadow-xl">
            {issue.resolutionEvidence?.afterImage ? (
              <img src={issue.resolutionEvidence.afterImage} className="w-full h-full object-cover" alt="After" />
            ) : (
              <div className="w-full h-full bg-emerald-200 flex items-center justify-center text-emerald-400"><Camera size={32}/></div>
            )}
        </div>
    </div>
</div>

                {/* DETAILS */}
<div className="flex-1">
    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block">Audit Protocol Active</span>
    <h3 className="text-2xl font-black text-[#1F2937] leading-none uppercase tracking-tight">{issue.itemName} — Resolved</h3>
    <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-emerald-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><IndianRupee size={20}/></div>
            <div><p className="text-[9px] font-black text-gray-400 uppercase leading-none">Reimbursement</p><p className="text-lg font-black text-emerald-900">₹{issue.finalInvoice?.amount || 0}</p></div>
        </div>
        <div className="p-5 bg-white rounded-3xl border border-emerald-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">{issue.resolutionEvidence?.hasOfficialBill ? <FileText size={18}/> : <User size={18}/>}</div>
            <div><p className="text-[9px] font-black text-gray-400 uppercase leading-none">Provider</p><p className="text-sm font-black text-gray-700">{issue.resolutionEvidence?.hasOfficialBill ? "Official GST" : issue.resolutionEvidence?.workerName || "Local Worker"}</p></div>
        </div>
    </div>
    {/* ✅ FIXED: Correcting Worker Detail visibility */}
    {!issue.resolutionEvidence?.hasOfficialBill && (
        <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-[10px] text-blue-700 font-black uppercase flex items-center gap-2 tracking-widest mb-2">
            <Info size={12}/> Worker: {issue.resolutionEvidence?.workerName} ({issue.resolutionEvidence?.workerContact})
          </p>
          {issue.resolutionEvidence?.workerVerified ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <BadgeCheck size={14} />
              <span className="text-[9px] font-black uppercase">Worker Verified</span>
            </div>
          ) : (
            <button 
              onClick={() => setVerifyingWorker(issue._id)}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-colors"
            >
              Verify Worker Details
            </button>
          )}
        </div>
    )}
</div>

                {/* BUTTONS */}
                <div className="xl:w-64 flex flex-col justify-center gap-3">
                  {!issue.resolutionEvidence?.workerVerified && !issue.resolutionEvidence?.hasOfficialBill ? (
                    <button
                      disabled
                      className="w-full py-5 bg-gray-300 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg text-center cursor-not-allowed"
                    >
                      Verify Worker First
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyResolution(issue._id)}
                      className="w-full py-5 bg-[#0D9488] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={18} />
                      Verify & Archive
                    </button>
                  )}

                  {/* Dispute Amount - Only for Tenant-Submitted Evidence */}
                  {issue.responsibility === "tenant" && (
                    <button
                      onClick={() => setDisputeIssue(issue._id)}
                      className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors text-center py-2"
                    >
                      Reject & Send Back
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </section>
        )}

        {/* HISTORY */}
        <section className="space-y-6 pb-20">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">
            Verified Vault History
          </h2>

          <div className="bg-white rounded-[48px] border border-gray-100 overflow-hidden shadow-sm">
            {history.length === 0 ? (
              <p className="p-10 text-center text-gray-300 text-[10px] font-black uppercase">
                Archive empty
              </p>
            ) : (
              history.map((issue: any) => (
                <div
                  key={issue._id}
                  className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20 last:border-none"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                        issue.status === "resolved"
                          ? "bg-teal-50 text-[#0D9488]"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {issue.status === "resolved" ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <XCircle size={24} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#1F2937] uppercase tracking-tight">
                        {issue.itemName} — {issue.roomName}
                      </p>

                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                        {issue.responsibility === "owner" ? "Professional Assigned" : "Responsible: " + issue.responsibility} • Cost: ₹
                        {issue.finalInvoice?.amount || issue.estimatedCost || 0}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </p>

                    <p
                      className={`text-[9px] font-black uppercase mt-1 ${
                        issue.status === "resolved"
                          ? issue.responsibility === "owner"
                            ? "text-purple-600"
                            : "text-teal-600"
                          : "text-red-400"
                      }`}
                    >
                      {issue.status === "resolved"
                        ? issue.responsibility === "owner"
                          ? "Professional Fixed"
                          : "Vault Secured"
                        : "Rejected"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* REJECTION MODAL */}
        <AnimatePresence>
          {disputeIssue && (
            <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-[#1F2937] mb-2 leading-none">Reject Submission</h2>
                <p className="text-gray-400 text-sm mb-8 font-medium tracking-tight">
                  Provide your reason for rejecting this submission. The tenant will be notified and must resubmit.
                </p>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase block">Rejection Reason</label>
                  <textarea 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border border-gray-100 focus:border-red-500 resize-none h-24"
                    placeholder="e.g., Photo quality is poor, bill amount is too high, need better evidence..."
                  />
                </div>

                <div className="flex gap-4 mt-10">
                  <button 
                    onClick={() => {
                      setDisputeIssue(null);
                      setDisputeReason("");
                    }}
                    className="flex-1 py-4 text-gray-400 font-bold text-[10px] uppercase hover:text-gray-600"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDisputeVerification(disputeIssue)}
                    disabled={!disputeReason.trim()}
                    className="flex-[2] py-5 bg-red-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject & Notify
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* WORKER VERIFICATION MODAL */}
        <AnimatePresence>
          {verifyingWorker && (
            <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-[#1F2937] mb-2 leading-none">Verify Worker</h2>
                <p className="text-gray-400 text-sm mb-8 font-medium tracking-tight">
                  Confirm the worker details are authentic and credible before approval.
                </p>

                {verificationQueue.find(i => i._id === verifyingWorker) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-600 uppercase mb-3">Worker Information</p>
                      <div className="space-y-2 text-sm">
                        <p className="font-black text-gray-700">
                          {verificationQueue.find(i => i._id === verifyingWorker)?.resolutionEvidence?.workerName}
                        </p>
                        <p className="text-gray-600">
                          Phone: {verificationQueue.find(i => i._id === verifyingWorker)?.resolutionEvidence?.workerContact}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[9px] font-black text-green-600 uppercase mb-2">Verification Checklist</p>
                      <ul className="text-[10px] text-green-700 space-y-1 font-medium">
                        <li>✓ Phone number is valid</li>
                        <li>✓ Worker reputation verified</li>
                        <li>✓ Rate is market-appropriate</li>
                        <li>✓ After photos show quality work</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-10">
                  <button 
                    onClick={() => setVerifyingWorker(null)}
                    className="flex-1 py-4 text-gray-400 font-bold text-[10px] uppercase hover:text-gray-600"
                  >
                    Needs More Info
                  </button>
                  <button 
                    onClick={() => handleVerifyWorker(verifyingWorker)}
                    className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                  >
                    <BadgeCheck size={16} />
                    Confirm Worker
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}