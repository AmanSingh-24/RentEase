"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  RefreshCw,
  MapPin,
  IndianRupee,
  Home,
  User,
  ExternalLink,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: "New Application", color: "bg-blue-100 text-blue-700" },
  kyc_requested: { label: "KYC Requested", color: "bg-amber-100 text-amber-700" },
  pre_approved: { label: "KYC Received", color: "bg-purple-100 text-purple-700" },
  approved: { label: "Approved ✓", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-500" },
};

export default function OwnerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/owner");
      const data = await res.json();
      if (res.ok) setApplications(data.applications || []);
      else showToast(data.error || "Failed to load applications", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const doAction = async (type: "pre-approve" | "reject" | "finalize", applicationId: string) => {
    setActionLoading(applicationId + type);
    try {
      const endpoint =
        type === "pre-approve" ? "/api/applications/pre-approve" :
        type === "finalize" ? "/api/applications/finalize" :
        "/api/applications/reject";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setSelected(null);
        await fetchApplications();
      } else {
        showToast(data.error || "Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const grouped = applications.reduce((acc: Record<string, any[]>, app: any) => {
    const propId = app.propertyId?._id || "unknown";
    const key = `${propId}_${app.propertyId?.address}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(app);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl ${
          toast.type === "success" ? "bg-[#10B981] text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1F2937]">Rental Applications</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review tenant applications and manage your approval pipeline.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#0052CC]" size={36} />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList size={48} className="text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-500 mb-2">No Applications Yet</h2>
          <p className="text-gray-400 text-sm max-w-xs">
            Once tenants discover your listings on the marketplace and apply, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([key, apps]) => {
            const firstApp = apps[0];
            const prop = firstApp?.propertyId;
            return (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Property Header */}
                <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    {prop?.listingImages?.[0] ? (
                      <img src={prop.listingImages[0]} alt={prop.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-[#1F2937] text-sm">{prop?.address || "Property"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {prop?.city || "—"} · {prop?.bhk} BHK · ₹{Number(prop?.rentAmount || 0).toLocaleString("en-IN")}/mo
                    </p>
                  </div>
                  <span className="ml-auto bg-blue-50 text-[#0052CC] text-xs font-black px-3 py-1 rounded-full">
                    {apps.length} application{apps.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Applications List */}
                <div className="divide-y divide-gray-50">
                  {apps.map((app: any) => {
                    const statusCfg = STATUS_CONFIG[app.status] || { label: app.status, color: "bg-gray-100 text-gray-500" };
                    const isProcessing = actionLoading?.startsWith(app._id);
                    return (
                      <div key={app._id} className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-black text-[#0052CC] uppercase text-sm flex-shrink-0">
                              {app.tenantId?.name?.charAt(0) || "T"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-[#1F2937] text-sm">
                                  {app.applicantDetails?.fullName || app.tenantId?.name}
                                </p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{app.tenantId?.email}</p>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                <span>📞 {app.applicantDetails?.phone || "N/A"}</span>
                                <span>💰 ₹{Number(app.applicantDetails?.monthlyIncome || 0).toLocaleString("en-IN")}/mo income</span>
                                <span>👥 {app.applicantDetails?.occupantsCount || 1} occupant(s)</span>
                                {app.applicantDetails?.targetMoveInDate && (
                                  <span>📅 Move-in: {new Date(app.applicantDetails.targetMoveInDate).toLocaleDateString("en-IN")}</span>
                                )}
                              </div>
                              {app.applicantDetails?.notes && (
                                <p className="mt-1 text-xs text-gray-400 italic">"{app.applicantDetails.notes}"</p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {/* View KYC Document (if pre_approved) */}
                            {["pre_approved", "approved"].includes(app.status) && app.tenantKycUrl && (
                              <a
                                href={app.tenantKycUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                <Eye size={13} /> View KYC
                                <ExternalLink size={10} />
                              </a>
                            )}

                            {/* Pre-Approve (from submitted) */}
                            {app.status === "submitted" && (
                              <>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("pre-approve", app._id)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0052CC] text-white rounded-xl font-bold text-xs hover:bg-[#0041a3] transition-colors disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                  Pre-Approve & Request KYC
                                </button>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("reject", app._id)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            )}

                            {/* KYC Requested — waiting for tenant */}
                            {app.status === "kyc_requested" && (
                              <span className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs flex items-center gap-1">
                                ⏳ Waiting for tenant KYC upload
                              </span>
                            )}

                            {/* Finalize (from pre_approved — KYC received) */}
                            {app.status === "pre_approved" && (
                              <>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("finalize", app._id)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-[#10B981] text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                  Approve & Sign Lease
                                </button>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("reject", app._id)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            )}

                            {/* Applied date */}
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-300 font-bold mt-3 uppercase tracking-widest">
                          Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
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
