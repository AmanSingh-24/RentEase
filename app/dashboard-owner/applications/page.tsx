"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, CheckCircle, XCircle, Loader2,
  RefreshCw, MapPin, Home, Phone, Mail, User,
  Copy, Check, Send, PhoneCall
} from "lucide-react";

type BookingStatusTab = "all" | "pending" | "assigned" | "rejected";

export default function OwnerApplicationsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<BookingStatusTab>("pending");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/owner");
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
      else showToast(data.error || "Failed to load bookings", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const doAction = async (type: "assign" | "reject", bookingId: string) => {
    setActionLoading(bookingId + type);
    try {
      const endpoint = type === "assign" ? "/api/bookings/assign" : "/api/bookings/reject";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          type === "assign"
            ? "Property assigned! Tenant will now proceed with payment."
            : "Booking rejected.",
          "success"
        );
        await fetchBookings();
      } else {
        showToast(data.error || "Action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter bookings based on active status tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "assigned") return b.status === "pending_payment" || b.status === "verified";
    if (activeTab === "rejected") return b.status === "rejected";
    return true;
  });

  // Group filtered bookings by property
  const grouped = filteredBookings.reduce((acc: Record<string, any[]>, booking: any) => {
    const propId = booking.propertyId?._id || "unknown";
    if (!acc[propId]) acc[propId] = [];
    acc[propId].push(booking);
    return acc;
  }, {});

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
            Booking Requests
          </h1>
          <p className="text-xs text-neutral-500 font-medium max-w-2xl">
            Review requests from prospective tenants. Connect via email or phone call, discuss lease requirements, then decide whether to assign or reject.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all shadow-2xs active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Status
        </button>
      </div>

      {/* ── Status Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
        {[
          { id: "pending", label: "Pending Review" },
          { id: "assigned", label: "Assigned" },
          { id: "rejected", label: "Rejected" },
          { id: "all", label: "All Requests" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const count = bookings.filter((b) => {
            if (tab.id === "pending") return b.status === "pending";
            if (tab.id === "assigned") return b.status === "pending_payment" || b.status === "verified";
            if (tab.id === "rejected") return b.status === "rejected";
            return true;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BookingStatusTab)}
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
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
          <ClipboardList size={40} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900 mb-1">
            No {activeTab !== "all" ? activeTab : ""} booking requests
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Applications from prospective tenants will appear here. Start by listing your active residential rentals.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([propId, propBookings]) => {
            const prop = (propBookings[0] as any).propertyId;
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
                      <MapPin size={10} className="text-neutral-400" /> {prop?.city || "Location"} · {prop?.bhk || 1} BHK ·
                      ₹{Number(prop?.rentAmount || 0).toLocaleString("en-IN")}/month rent
                    </p>
                  </div>
                </div>

                {/* Booking Cards list */}
                <div className="divide-y divide-neutral-100">
                  {(propBookings as any[]).map((booking: any) => {
                    const isProcessing = actionLoading?.startsWith(booking._id);
                    const isAssigned = booking.status === "pending_payment" || booking.status === "verified";
                    const isRejected = booking.status === "rejected";

                    return (
                      <div key={booking._id} className="p-5 hover:bg-neutral-50/20 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          {/* Left: Tenant Profile Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-11 h-11 bg-neutral-950 text-white rounded-xl flex items-center justify-center font-black uppercase text-base flex-shrink-0 shadow-sm">
                              {booking.tenantContact?.name?.charAt(0) || "T"}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-neutral-900 text-sm">{booking.tenantContact?.name}</p>
                                {isAssigned && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                    ✓ Assigned
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/50">
                                    Rejected
                                  </span>
                                )}
                                {booking.status === "pending" && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                    New Applicant
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">
                                Applied on {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          {/* Middle: 1-Click Interactive Communication Drawer */}
                          <div className="flex flex-wrap items-center gap-3.5 bg-neutral-50/80 p-2 px-3 rounded-xl border border-neutral-200/60 max-w-fit">
                            {/* Phone Call link */}
                            <a
                              href={`tel:${booking.tenantContact?.phone}`}
                              className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 transition-colors"
                              title="Start Phone Call"
                            >
                              <PhoneCall size={13} className="text-neutral-500" />
                              <span>{booking.tenantContact?.phone}</span>
                            </a>

                            <div className="w-px h-4 bg-neutral-200" />

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyPhone(booking.tenantContact?.phone, booking._id)}
                              className="p-1 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-all cursor-pointer"
                              title="Copy Phone Number"
                            >
                              {copiedId === booking._id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>

                            <div className="w-px h-4 bg-neutral-200" />

                            {/* Email link */}
                            <a
                              href={`mailto:${booking.tenantContact?.email}?subject=RentEase: Regarding your booking application for ${encodeURIComponent(prop?.address || "")}`}
                              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Send Email"
                            >
                              <Mail size={13} />
                              <span className="underline decoration-indigo-200 hover:decoration-indigo-600">Send Email</span>
                            </a>
                          </div>

                          {/* Right: Decision Actions */}
                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                            {booking.status === "pending" && (
                              <>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("assign", booking._id)}
                                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                  Assign Asset
                                </button>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("reject", booking._id)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            )}
                            {isAssigned && (
                              <span className="px-4 py-2.5 bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs flex items-center gap-1.5">
                                <CheckCircle size={13} /> Waiting for tenant payment
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-4 py-2.5 bg-neutral-100 text-neutral-500 rounded-xl font-bold text-xs flex items-center gap-1.5">
                                <XCircle size={13} /> Listing application rejected
                              </span>
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
