"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Loader2,
  RefreshCw,
  MapPin,
  Home,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  submitted: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-700",
    description: "The landlord is reviewing your application.",
  },
  kyc_requested: {
    label: "Action Required",
    color: "bg-amber-100 text-amber-700",
    description: "The landlord pre-approved you! Please upload your Government ID to proceed.",
  },
  pre_approved: {
    label: "KYC Submitted",
    color: "bg-purple-100 text-purple-700",
    description: "Your Govt ID has been received. Waiting for the landlord to finalize the lease.",
  },
  approved: {
    label: "Approved ✓",
    color: "bg-green-100 text-green-700",
    description: "Lease approved! You now have access to your tenancy dashboard.",
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-600",
    description: "The landlord did not select your application for this property.",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-500",
    description: "You withdrew this application.",
  },
};

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // KYC Upload modal state
  const [kycModal, setKycModal] = useState<{ applicationId: string; propertyAddress: string } | null>(null);
  const [kycFile, setKycFile] = useState<string | null>(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const kycInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/tenant");
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

  const handleKycFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setKycFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleKycUpload = async () => {
    if (!kycModal || !kycFile) {
      showToast("Please select a document to upload.", "error");
      return;
    }
    setUploadingKyc(true);
    try {
      const res = await fetch("/api/applications/upload-kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: kycModal.applicationId,
          kycDocumentBase64: kycFile,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Government ID uploaded successfully!", "success");
        setKycModal(null);
        setKycFile(null);
        await fetchApplications();
      } else {
        showToast(data.error || "Upload failed", "error");
      }
    } catch {
      showToast("Network error during upload", "error");
    } finally {
      setUploadingKyc(false);
    }
  };

  // Sort: action-required first, then by date
  const sortedApps = [...applications].sort((a, b) => {
    const priority: Record<string, number> = {
      kyc_requested: 0,
      submitted: 1,
      pre_approved: 2,
      approved: 3,
      rejected: 4,
      withdrawn: 5,
    };
    return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
  });

  const actionRequired = sortedApps.filter((a) => a.status === "kyc_requested");

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

      {/* KYC Upload Modal */}
      {kycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-black text-[#1F2937] text-lg">Upload Government ID</h3>
                <p className="text-sm text-gray-400 mt-1">{kycModal.propertyAddress}</p>
              </div>
              <button
                onClick={() => { setKycModal(null); setKycFile(null); }}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-amber-800 font-medium mb-2">
                🎉 You've been pre-approved!
              </p>
              <p className="text-xs text-amber-700">
                The landlord would like to verify your identity before finalizing the lease. Please upload a valid Government ID.
              </p>
            </div>

            <div className="mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Accepted: Aadhaar, PAN, Passport, Voter ID
              </p>
              <div
                onClick={() => kycInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  kycFile
                    ? "border-[#10B981] bg-green-50"
                    : "border-gray-200 hover:border-[#0052CC] hover:bg-blue-50/30"
                }`}
              >
                <input
                  ref={kycInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleKycFileSelect}
                />
                {kycFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle size={28} className="text-[#10B981]" />
                    <p className="text-sm font-bold text-[#10B981]">Document selected ✓</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setKycFile(null); }}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={28} className="text-gray-300" />
                    <p className="text-sm font-bold text-gray-500">Click to upload your Govt ID</p>
                    <p className="text-xs text-gray-400">JPG, PNG or PDF — Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 mb-5">
              🔒 Your ID is securely stored and only visible to this landlord for verification purposes.
            </p>

            <button
              onClick={handleKycUpload}
              disabled={!kycFile || uploadingKyc}
              className="w-full py-3.5 bg-[#0052CC] text-white rounded-xl font-black text-sm hover:bg-[#0041a3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadingKyc ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading...</>
              ) : (
                <>Upload Govt ID <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1F2937]">My Applications</h1>
          <p className="text-gray-400 text-sm mt-1">Track your rental applications and complete required steps.</p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Action Required Banner */}
      {actionRequired.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-black text-amber-800">
              {actionRequired.length} application{actionRequired.length > 1 ? "s require" : " requires"} your action
            </p>
            <p className="text-sm text-amber-700 mt-1">
              A landlord has pre-approved you! Please upload your Government ID to proceed.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#0052CC]" size={36} />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList size={48} className="text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-500 mb-2">No Applications Yet</h2>
          <p className="text-gray-400 text-sm max-w-xs mb-6">
            Browse properties on the marketplace and apply for the ones you like.
          </p>
          <a
            href="/properties"
            className="px-6 py-3 bg-[#0052CC] text-white rounded-xl font-bold text-sm hover:bg-[#0041a3] transition-colors"
          >
            Browse Properties →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedApps.map((app: any) => {
            const prop = app.propertyId;
            const cfg = STATUS_CONFIG[app.status] || {
              label: app.status,
              color: "bg-gray-100 text-gray-500",
              description: "",
            };
            const isActionRequired = app.status === "kyc_requested";

            return (
              <div
                key={app._id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isActionRequired ? "border-amber-200 ring-2 ring-amber-100" : "border-gray-100"
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Property Image */}
                  <div className="w-full md:w-36 h-32 md:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
                    {prop?.listingImages?.[0] ? (
                      <img
                        src={prop.listingImages[0]}
                        alt={prop.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={28} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-black text-[#1F2937]">{prop?.address || "Property"}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {prop?.city || "—"} · {prop?.bhk} BHK · ₹{Number(prop?.rentAmount || 0).toLocaleString("en-IN")}/mo
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Owner: <span className="font-bold text-gray-600">{app.ownerId?.name}</span>
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full self-start ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Status Description */}
                    <p className="text-xs text-gray-500 mb-4">{cfg.description}</p>

                    {/* Timeline Steps */}
                    <div className="flex items-center gap-1 mb-4">
                      {["submitted", "kyc_requested", "pre_approved", "approved"].map((s, i) => {
                        const statuses = ["submitted", "kyc_requested", "pre_approved", "approved"];
                        const currentIdx = statuses.indexOf(app.status);
                        const stepIdx = statuses.indexOf(s);
                        const isDone = currentIdx > stepIdx || app.status === s;
                        const isCurrent = app.status === s;
                        return (
                          <div key={s} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              isDone ? (isCurrent ? "bg-[#0052CC]" : "bg-[#10B981]") : "bg-gray-200"
                            }`} />
                            {i < 3 && <div className={`h-0.5 w-6 ${isDone && !isCurrent ? "bg-[#10B981]" : "bg-gray-200"}`} />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Rejection Reason */}
                    {app.status === "rejected" && app.rejectionReason && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">
                        ✗ {app.rejectionReason}
                      </p>
                    )}

                    {/* Action: Upload KYC */}
                    {isActionRequired && (
                      <button
                        onClick={() =>
                          setKycModal({
                            applicationId: app._id,
                            propertyAddress: prop?.address || "Property",
                          })
                        }
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold text-sm hover:bg-[#0041a3] transition-colors"
                      >
                        <Upload size={15} /> Upload Government ID
                      </button>
                    )}

                    {/* Approved: Link to dashboard */}
                    {app.status === "approved" && (
                      <a
                        href="/dashboard-tenant"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors w-fit"
                      >
                        <CheckCircle size={15} /> Go to Tenancy Dashboard
                      </a>
                    )}

                    <p className="text-[9px] text-gray-300 font-bold mt-3 uppercase tracking-widest">
                      Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
