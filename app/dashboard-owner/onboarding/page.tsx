"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, CheckCircle, Loader2, RefreshCw, MapPin,
  Home, ExternalLink, ShieldCheck, IndianRupee,
} from "lucide-react";

export default function OwnerOnboardingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/pending-approval");
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else showToast(data.error || "Failed to load", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleApprove = async (propertyId: string) => {
    setActionLoading(propertyId);
    try {
      const res = await fetch("/api/bookings/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Tenant onboarded successfully! They now have full dashboard access.", "success");
        await fetchItems();
      } else {
        showToast(data.error || "Failed to approve", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="text-3xl font-black text-[#1F2937]">Onboard Your Customers</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review tenant payment proofs and rental agreement signatures, then approve to grant dashboard access.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#0052CC]" size={36} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-gray-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-500 mb-2">No Pending Approvals</h2>
          <p className="text-gray-400 text-sm max-w-xs">
            When assigned tenants complete their payment and sign the rental agreement, they'll appear here for your final approval.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(({ property, booking }) => (
            <div key={property._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Property Header */}
              <div className="p-5 bg-gradient-to-r from-[#0052CC]/5 to-transparent border-b border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                  {property.listingImages?.[0] ? (
                    <img src={property.listingImages[0]} alt={property.address} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#1F2937]">{property.address}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {property.city} · {property.bhk} BHK
                  </p>
                  <p className="text-xs font-bold text-[#0052CC] mt-1 flex items-center gap-1">
                    <IndianRupee size={10} />
                    Rent: ₹{Number(property.rentAmount).toLocaleString("en-IN")}/mo ·
                    Deposit: ₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full">
                  ⏳ Awaiting Approval
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Tenant Details */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tenant</p>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#0052CC]/10 flex items-center justify-center font-black text-[#0052CC]">
                      {property.tenantId?.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <p className="font-black text-[#1F2937] text-sm">{property.tenantId?.name || "Tenant"}</p>
                      <p className="text-xs text-gray-400">{property.tenantId?.email}</p>
                    </div>
                    <ShieldCheck size={18} className="ml-auto text-[#10B981]" />
                  </div>
                </div>

                {/* Verification Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Signature Status */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Rental Agreement</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#10B981]" />
                      <p className="text-sm font-bold text-green-800">Signed by Tenant ✓</p>
                    </div>
                    {property.agreement?.signedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Signed on {new Date(property.agreement.signedAt).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1">Payment Proof</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#0052CC]" />
                      <p className="text-sm font-bold text-[#0052CC]">Submitted by Tenant ✓</p>
                    </div>
                    <p className="text-xs text-blue-500 mt-1">
                      Total: ₹{(Number(property.rentAmount) + Number(property.depositAmount || 0)).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Signature Preview */}
                {property.agreement?.blockchainHash && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Digital Signature</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white p-2">
                      <img
                        src={property.agreement.blockchainHash}
                        alt="Tenant signature"
                        className="max-h-24 object-contain w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Approve Button */}
                <button
                  disabled={actionLoading === property._id}
                  onClick={() => handleApprove(property._id)}
                  className="w-full py-4 bg-[#10B981] text-white rounded-xl font-black text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === property._id ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle size={16} /> Approve & Onboard Tenant</>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Clicking Approve grants this tenant immediate access to their tenant dashboard.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
