"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  FileText,
} from "lucide-react";

type Tab = "landlords" | "properties" | "oversight";

const STATUS_COLORS: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  pending_verification: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  unboarded: "bg-gray-100 text-gray-500",
  active_marketplace: "bg-green-100 text-green-700",
  pending_approval: "bg-amber-100 text-amber-700",
  occupied: "bg-blue-100 text-blue-700",
  unlisted: "bg-gray-100 text-gray-500",
  draft: "bg-gray-100 text-gray-500",
};

function ConfirmModal({
  title,
  message,
  requireReason,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  requireReason: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="font-black text-[#1F2937] text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {requireReason && (
          <textarea
            placeholder="Enter reason (optional but recommended)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] resize-none mb-4"
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            className="flex-1 py-3 bg-[#1F2937] text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("landlords");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    pendingLandlords: [],
    pendingProperties: [],
    allUsers: [],
    allListings: [],
    recentApplications: [],
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    requireReason: boolean;
    onConfirm: (reason?: string) => void;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending-approvals");
      const json = await res.json();
      if (res.ok) setData(json);
      else showToast(json.error || "Failed to load data", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAction = async (type: string, targetId: string, reason?: string) => {
    setActionLoading(targetId);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, reason }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(json.message, "success");
        await fetchData(); // Refresh data
      } else {
        showToast(json.error || "Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const promptAction = (
    title: string,
    message: string,
    requireReason: boolean,
    type: string,
    targetId: string
  ) => {
    setConfirm({
      title,
      message,
      requireReason,
      onConfirm: (reason) => runAction(type, targetId, reason),
    });
  };

  const tabs = [
    { id: "landlords" as Tab, label: "Pending Landlords", icon: Users, count: data.pendingLandlords.length },
    { id: "properties" as Tab, label: "Pending Listings", icon: Building2, count: data.pendingProperties.length },
    { id: "oversight" as Tab, label: "Oversight", icon: ShieldCheck, count: null },
  ];

  return (
    <div className="p-6 md:p-10">
      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
            toast.type === "success" ? "bg-[#10B981] text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          requireReason={confirm.requireReason}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1F2937]">Admin Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">
            {data.pendingLandlords.length + data.pendingProperties.length} items awaiting review
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#0052CC]" size={36} />
        </div>
      ) : (
        <>
          {/* ── TAB 1: Pending Landlords ─────────────────────────────────── */}
          {activeTab === "landlords" && (
            <div className="space-y-4">
              {data.pendingLandlords.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No pending landlord verifications</p>
                </div>
              ) : (
                data.pendingLandlords.map((landlord: any) => (
                  <div
                    key={landlord._id}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center font-black text-[#0052CC] text-lg uppercase">
                          {landlord.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-black text-[#1F2937]">{landlord.name}</p>
                          <p className="text-sm text-gray-400">{landlord.email}</p>
                          {landlord.kycDetails && (
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                              <span>📞 {landlord.kycDetails.phone || "N/A"}</span>
                              <span>👤 {landlord.kycDetails.fullName || "N/A"}</span>
                              <span>
                                📅 Submitted:{" "}
                                {landlord.kycDetails.submittedAt
                                  ? new Date(landlord.kycDetails.submittedAt).toLocaleDateString("en-IN")
                                  : "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {landlord.kycDetails?.idDocumentUrl && (
                          <a
                            href={landlord.kycDetails.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Eye size={14} /> View ID Document
                            <ExternalLink size={11} />
                          </a>
                        )}
                        <button
                          disabled={actionLoading === landlord._id}
                          onClick={() =>
                            promptAction(
                              "Approve Landlord KYC?",
                              `Approve identity verification for ${landlord.name}?`,
                              false,
                              "approve_landlord",
                              landlord._id
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === landlord._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Approve
                        </button>
                        <button
                          disabled={actionLoading === landlord._id}
                          onClick={() =>
                            promptAction(
                              "Reject Landlord KYC",
                              `Reject identity verification for ${landlord.name}? Please provide a reason.`,
                              true,
                              "reject_landlord",
                              landlord._id
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB 2: Pending Properties ────────────────────────────────── */}
          {activeTab === "properties" && (
            <div className="space-y-4">
              {data.pendingProperties.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No pending property listings</p>
                </div>
              ) : (
                data.pendingProperties.map((prop: any) => {
                  const ownerVerified = prop.ownerId?.verificationStatus === "verified";
                  return (
                    <div
                      key={prop._id}
                      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Property Image Preview */}
                        <div className="w-full md:w-32 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {prop.listingImages?.[0] ? (
                            <img
                              src={prop.listingImages[0]}
                              alt={prop.address}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Building2 size={28} />
                            </div>
                          )}
                        </div>

                        {/* Property Details */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-[#1F2937]">{prop.address}</p>
                              <p className="text-sm text-gray-400">
                                {prop.city}{prop.state ? `, ${prop.state}` : ""} {prop.pincode ? `— ${prop.pincode}` : ""}
                              </p>
                              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                <span className="font-bold">₹{Number(prop.rentAmount).toLocaleString("en-IN")}/mo</span>
                                <span>{prop.bhk} BHK</span>
                                <span>{prop.furnishing?.replace("_", " ")}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                ownerVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                Owner: {ownerVerified ? "KYC Verified ✓" : "⚠ KYC Pending"}
                              </span>
                            </div>
                          </div>

                          {/* Owner Info */}
                          <p className="text-xs text-gray-400 mt-2">
                            Owner: <span className="font-bold text-gray-600">{prop.ownerId?.name}</span> ({prop.ownerId?.email})
                          </p>

                          {!ownerVerified && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
                              <AlertTriangle size={14} />
                              Approve the owner's KYC first before approving this listing.
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-3 mt-4">
                            {prop.ownershipProofUrl && (
                              <a
                                href={prop.ownershipProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                <FileTextIcon size={14} /> View Deed
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <button
                              disabled={actionLoading === prop._id}
                              onClick={() =>
                                promptAction(
                                  "Approve Property Listing?",
                                  `Approve "${prop.address}" for the public marketplace?`,
                                  false,
                                  "approve_property",
                                  prop._id
                                )
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === prop._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Approve & List
                            </button>
                            <button
                              disabled={actionLoading === prop._id}
                              onClick={() =>
                                promptAction(
                                  "Reject Property Listing",
                                  `Reject the listing for "${prop.address}"? Please provide a reason.`,
                                  true,
                                  "reject_property",
                                  prop._id
                                )
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB 3: Oversight ─────────────────────────────────────────── */}
          {activeTab === "oversight" && (
            <div className="space-y-8">
              {/* All Users Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="font-black text-[#1F2937]">All Users ({data.allUsers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">KYC Status</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.allUsers.map((user: any) => (
                        <tr key={user._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-bold text-[#1F2937]">{user.name}</td>
                          <td className="px-6 py-4 text-gray-500">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                              user.role === "admin" ? "bg-purple-100 text-purple-700" :
                              user.role === "owner" ? "bg-blue-100 text-blue-700" :
                              user.role === "tenant" ? "bg-teal-100 text-teal-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                              STATUS_COLORS[user.verificationStatus] || "bg-gray-100 text-gray-500"
                            }`}>
                              {user.verificationStatus || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role !== "admin" && user.verificationStatus !== "rejected" && (
                              <button
                                disabled={actionLoading === user._id}
                                onClick={() =>
                                  promptAction(
                                    "Suspend User?",
                                    `Suspend ${user.name}'s account? Please provide a reason.`,
                                    true,
                                    "suspend_user",
                                    user._id
                                  )
                                }
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Listings Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="font-black text-[#1F2937]">All Listings ({data.allListings.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="px-6 py-3 text-left">Address</th>
                        <th className="px-6 py-3 text-left">City</th>
                        <th className="px-6 py-3 text-left">Rent</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Owner</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.allListings.map((listing: any) => (
                        <tr key={listing._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-bold text-[#1F2937] max-w-[200px] truncate">
                            {listing.address}
                          </td>
                          <td className="px-6 py-4 text-gray-500">{listing.city || "—"}</td>
                          <td className="px-6 py-4 font-bold text-[#10B981]">
                            ₹{Number(listing.rentAmount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                              STATUS_COLORS[listing.listingStatus] || "bg-gray-100 text-gray-500"
                            }`}>
                              {listing.listingStatus?.replace("_", " ") || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {listing.ownerId?.name || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {listing.listingStatus === "active_marketplace" && (
                              <button
                                disabled={actionLoading === listing._id}
                                onClick={() =>
                                  promptAction(
                                    "Delist Property?",
                                    `Remove "${listing.address}" from the marketplace?`,
                                    false,
                                    "delist_property",
                                    listing._id
                                  )
                                }
                                className="text-xs font-bold text-orange-500 hover:text-orange-700 transition-colors"
                              >
                                Delist
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Inline icon because lucide doesn't export FileText well in some envs
function FileTextIcon({ size }: { size: number }) {
  return <FileText size={size} />;
}
