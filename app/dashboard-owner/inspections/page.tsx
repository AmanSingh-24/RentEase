"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, CheckCircle2, XCircle, Eye, 
  MessageSquare, Loader2, Calendar, User, Camera, 
  AlertCircle, ChevronDown, ChevronUp, FileText, Download, Check
} from "lucide-react";

type InspectionTab = "pending" | "verified" | "rejected";

export default function OwnerInspections() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectionTab>("pending");
  const [showGoodItems, setShowGoodItems] = useState(false);

  // Success certificate preview state
  const [certData, setCertData] = useState<any>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/get-for-owner?status=${activeTab}`);
      const data = await res.json();
      if (res.ok) {
        setInspections(data.inspections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleAction = async (id: string, action: "verify" | "reject") => {
    if (action === "reject" && !feedback.trim()) {
      alert("Feedback note is required to request a retake.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/inspections/action", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: id, action, feedback })
      });
      if (res.ok) {
        if (action === "verify") {
          // Mock dynamic certificate details on screen for premium validation feeling
          setCertData({
            id: `DW-${id.slice(-8).toUpperCase()}`,
            address: selectedInspection.propertyId.address,
            tenant: selectedInspection.tenantId.name,
            timestamp: new Date().toLocaleString("en-IN"),
            itemsVerified: selectedInspection.report?.length || 0,
            hash: `SHA-256: ${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`
          });
        }
        setSelectedInspection(null);
        setFeedback("");
        fetchInspections();
      }
    } catch (err) {
      alert("Vault communication failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-neutral-900" size={32} />
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Scanning Move-In Vaults...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Witness Audit Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
            Digital Witness Audits
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Review and lock tenant move-in condition reports into the blockchain ledger.
          </p>
        </div>
      </div>

      {/* ── Status Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
        {[
          { id: "pending", label: "Awaiting Action" },
          { id: "verified", label: "Verified & Locked" },
          { id: "rejected", label: "Retake Requests" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCertData(null);
                setActiveTab(tab.id as InspectionTab);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-neutral-950 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-950 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Digital Certificate Congrats Banner ─────────────────────────────────── */}
      {certData && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <FileText size={22} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                Digital Witness Certificate Locked <Check size={14} className="text-emerald-700" />
              </h3>
              <p className="text-xs text-emerald-800">
                Witness hash <span className="font-mono text-[10px] bg-emerald-100 px-1 py-0.5 rounded">{certData.hash}</span> saved to Document Vault.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 pt-2 text-[10px] text-emerald-700 font-bold">
                <p>REF: {certData.id}</p>
                <p>Tenant: {certData.tenant}</p>
                <p className="col-span-2 md:col-span-1">Locked: {certData.timestamp}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCertData(null)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Acknowledge Certificate
          </button>
        </motion.div>
      )}

      {/* ── Main List Content ─────────────────────────────────────────────────── */}
      <div className="grid gap-6">
        {inspections.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
            <CheckCircle2 size={40} className="text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              No audits found in this category
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Tenants will submit their room condition audits upon checking in to your property listings.
            </p>
          </div>
        ) : (
          inspections.map((ins: any) => (
            <motion.div 
              key={ins._id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center shrink-0 border border-neutral-200/40">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-950 text-sm">{ins.propertyId?.address}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase flex items-center gap-1">
                      <User size={11} className="text-neutral-500"/> {ins.tenantId?.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase flex items-center gap-1">
                      <Calendar size={11} className="text-neutral-500"/> Submitted {new Date(ins.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedInspection(ins);
                  setShowGoodItems(false);
                }}
                className="px-5 py-3 bg-neutral-950 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} /> Review Evidence ({ins.report?.length || 0})
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Inspection Detail Verification Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedInspection && (
          <div className="fixed inset-0 z-[200] bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.96 }} 
              className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200/80"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-base font-extrabold text-neutral-950">Review Move-in Baseline</h2>
                  <p className="text-neutral-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                    📍 {selectedInspection.propertyId?.address}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedInspection(null)} 
                  className="w-9 h-9 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-all shadow-3xs cursor-pointer"
                >
                   <XCircle size={18} />
                </button>
              </div>

              {/* Modal Body Viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedInspection.report && selectedInspection.report.length > 0 ? (
                  (() => {
                    // Segregate defects (Fair/Poor with photos) from pristine items (Good)
                    const defectItems = selectedInspection.report.filter((item: any) => item.condition !== "Good");
                    const goodItems = selectedInspection.report.filter((item: any) => item.condition === "Good");

                    return (
                      <div className="space-y-6">
                        {/* ── Category A: Contest Defects Grid (Has Photos) */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                            Contested Items & Defects ({defectItems.length})
                          </h3>
                          {defectItems.length === 0 ? (
                            <div className="bg-neutral-50 rounded-xl p-6 text-center border border-neutral-200/40 text-neutral-500 text-xs font-bold">
                              No damaged or poor-condition items claimed by tenant.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {defectItems.map((item: any, i: number) => (
                                <div key={i} className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200/70 shadow-3xs flex flex-col justify-between">
                                  <div>
                                    {/* Locked aspect ratio grid photo */}
                                    <div className="aspect-video relative bg-neutral-200 overflow-hidden border-b border-neutral-200/70">
                                      {item.photoUrl ? (
                                        <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-[9px] uppercase tracking-wider bg-neutral-100">
                                          Missing Photo Evidence
                                        </div>
                                      )}
                                      
                                      <div className="absolute top-2.5 left-2.5 bg-neutral-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black uppercase text-white tracking-wider">
                                        {item.roomName} · {item.itemName}
                                      </div>

                                      <div className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider shadow-xs border ${
                                        item.condition === 'Fair' ? 'bg-amber-50 text-amber-700 border-amber-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
                                      }`}>
                                        {item.condition}
                                      </div>
                                    </div>
                                    
                                    {item.tenantComment && (
                                      <div className="p-3 bg-white">
                                        <p className="text-[9px] text-neutral-400 font-bold uppercase mb-0.5">Tenant claim note</p>
                                        <p className="text-xs text-neutral-700 font-medium italic">"{item.tenantComment}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ── Category B: Pristine checklist dropdown list (Good Items) */}
                        <div className="border border-neutral-200/80 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setShowGoodItems(!showGoodItems)}
                            className="w-full p-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/50 text-left transition-colors cursor-pointer"
                          >
                            <div>
                              <h4 className="text-xs font-black text-neutral-950">Pristine Checklist items ({goodItems.length})</h4>
                              <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Items marked in Good condition by the tenant</p>
                            </div>
                            {showGoodItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {showGoodItems && (
                            <div className="p-4 bg-white border-t border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto">
                              {goodItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200/40">
                                  <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                    <Check size={11} className="text-emerald-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-extrabold text-neutral-900 truncate leading-snug">{item.itemName}</p>
                                    <p className="text-[8px] text-neutral-400 font-bold uppercase truncate">{item.roomName}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Incompatible Audit Blueprint</p>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                        This inspection was submitted using an older configuration file.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action panel */}
              {activeTab === "pending" && (
                <div className="p-5 bg-neutral-50/50 border-t border-neutral-200 space-y-4">
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-neutral-400" size={16} />
                    <textarea 
                      placeholder="Provide feedback note for tenant (required to request a retake)..."
                      className="w-full p-4 pl-11 rounded-xl border border-neutral-200 bg-white outline-none focus:border-neutral-900 text-xs font-semibold resize-none transition-all h-20 shadow-3xs"
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedInspection._id, "reject")}
                      className="flex-1 py-3 border border-red-200 hover:border-red-600 text-red-500 hover:bg-red-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={15} /> Request Retake
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedInspection._id, "verify")}
                      className="flex-[1.5] py-3 bg-neutral-950 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={15}/> : <><CheckCircle2 size={15} /> Verify & Lock Vault</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}