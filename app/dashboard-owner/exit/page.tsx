"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, Loader2, FileCheck, DollarSign, Archive, LogOut, CheckCircle2, Home, MapPin, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ExitStatusTab = "active" | "history";

export default function OwnerExitInbox() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExitStatusTab>("active");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exit/get-owner-requests`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (err) { 
      console.error("Vault request gathering sync failure:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // 📋 LEDGER EXECUTIVE REPORT PRINT GENERATOR
  const triggerPrintLedger = (req: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Popup blocker active. Enable popups to print report templates.");

    const lines = req.deductions?.map((d: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold;">${d.item}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${d.reason || "No explicit comment"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #DC2626; font-weight: bold;">-₹${d.amount}</td>
      </tr>
    `).join("") || "<tr><td colspan='3' style='padding: 10px; text-align: center; color: #9CA3AF;'>No adjustment penalties applied. Full refund distribution schema.</td></tr>";

    printWindow.document.write(`
      <html>
        <head>
          <title>RentEase_Executive_Settlement_Summary_${req._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1F2937; }
            .header-bar { border-bottom: 3px solid #1F2937; padding-bottom: 15px; margin-bottom: 30px; }
            .section-lbl { font-size: 10px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 2px; font-weight: bold; margin-bottom: 4px; }
            .section-val { font-size: 14px; font-weight: bold; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { text-align: left; background: #F3F4F6; padding: 10px; font-size: 11px; text-transform: uppercase; color: #4B5563; }
            .total-banner { background: #1F2937; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; font-style: italic; font-weight: 900;">Executive Settlement Closeout Ledger</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B7280;">RentEase Corporate Ecosystem Vault Services</p>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div class="section-lbl">Settlement Context ID</div><div class="section-val">REC-${req._id.slice(-8).toUpperCase()}</div>
              <div class="section-lbl">Associated Tenant Node</div><div class="section-val">${req.tenantId?.name || "System Archive Unit"}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-lbl">Closure Execution Date</div><div class="section-val">${new Date(req.createdAt).toLocaleDateString()}</div>
              <div class="section-lbl">Archival Status System</div><div class="section-val" style="color:#10B981;">VERIFIED_PAYOUT_RELEASED</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Ledger Deduction Item</th><th>Context Framework Description</th><th style="text-align: right;">Impact</th></tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <div class="total-banner">
            <div><span style="font-size: 10px; text-transform: uppercase; opacity: 0.7;">Discharged Refund Transferred</span><h2 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900;">₹${req.finalRefundAmount?.toLocaleString() || 0}</h2></div>
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px; border-radius: 6px;">Handshake Completed</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredRequests = requests.filter((r: any) => {
    if (activeTab === "active") return r.status !== "archived";
    if (activeTab === "history") return r.status === "archived";
    return true;
  });

  // Group by property (similar to applications page layout)
  const grouped = filteredRequests.reduce((acc: Record<string, any[]>, req: any) => {
    const propId = req.propertyId?._id || "unknown";
    if (!acc[propId]) acc[propId] = [];
    acc[propId].push(req);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight mb-1">
            Exit Control Center
          </h1>
          <p className="text-xs text-neutral-500 font-medium max-w-2xl">
            Manage ongoing tenant move-outs, track the audit pipeline, and review historical settlements from completed leases.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all shadow-2xs active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Pipeline
        </button>
      </div>

      {/* ── Status Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
        {[
          { id: "active", label: "Active Pipeline" },
          { id: "history", label: "Exit History" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const count = requests.filter((r) => {
            if (tab.id === "active") return r.status !== "archived";
            if (tab.id === "history") return r.status === "archived";
            return true;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExitStatusTab)}
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
                {count}
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
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
          {activeTab === "active" ? (
            <CheckCircle2 size={40} className="text-neutral-300 mx-auto mb-3" />
          ) : (
            <Archive size={40} className="text-neutral-300 mx-auto mb-3" />
          )}
          <h3 className="text-base font-bold text-neutral-900 mb-1">
            No {activeTab} exits found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeTab === "active" 
              ? "There are currently no active move-out requests in your pipeline." 
              : "You haven't completed any exit pipelines yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([propId, propRequests]) => {
            const prop = (propRequests[0] as any).propertyId;
            return (
              <div
                key={propId}
                className="bg-white rounded-2xl border border-neutral-200/85 shadow-2xs overflow-hidden"
              >
                {/* Property Header */}
                <div className="p-4 bg-neutral-50/50 border-b border-neutral-200/60 flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {prop?.listingImages?.[0] ? (
                      <img src={prop.listingImages[0]} alt={prop.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                        <Home size={18} className="text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-neutral-950 text-sm truncate">{prop?.address || "Asset Listing"}</p>
                    <p className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1.5 mt-0.5">
                      <MapPin size={10} className="text-neutral-400" /> {prop?.city || "Location"} · Exit Pipeline
                    </p>
                  </div>
                </div>

                {/* Exit Cards list */}
                <div className="divide-y divide-neutral-100">
                  {(propRequests as any[]).map((req: any) => {
                    return (
                      <div key={req._id} className="p-5 hover:bg-neutral-50/20 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                          {/* Left: Tenant Profile Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-11 h-11 bg-neutral-950 text-white rounded-xl flex items-center justify-center font-black uppercase text-base flex-shrink-0 shadow-sm">
                              {req.tenantId?.name?.charAt(0) || "T"}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-neutral-900 text-sm">{req.tenantId?.name || "Unknown Tenant"}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  activeTab === "active" 
                                    ? "bg-blue-50 text-blue-700 border-blue-200/50" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                }`}>
                                  {req.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">
                                Move-Out: {new Date(req.moveOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                            {activeTab === "active" ? (
                              <button 
                                onClick={() => router.push(`/dashboard-owner/exit/${req._id}`)}
                                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                View Pipeline <ArrowRight size={13}/>
                              </button>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="text-right mr-2 hidden md:block">
                                   <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mb-0.5">Final Payout</p>
                                   <p className="text-emerald-600 font-black text-sm">₹{(req.finalRefundAmount || 0).toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={() => triggerPrintLedger(req)} 
                                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <FileCheck size={13}/> Print Ledger
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}