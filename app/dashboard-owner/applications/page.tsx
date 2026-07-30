"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, CheckCircle, XCircle, Loader2,
  RefreshCw, MapPin, Home, Phone, Mail, User,
} from "lucide-react";

export default function OwnerApplicationsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

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

  // Group bookings by property
  const grouped = bookings.reduce((acc: Record<string, any[]>, booking: any) => {
    const propId = booking.propertyId?._id || "unknown";
    if (!acc[propId]) acc[propId] = [];
    acc[propId].push(booking);
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
          <h1 className="text-3xl font-black text-[#1F2937]">Booking Requests</h1>
          <p className="text-gray-400 text-sm mt-1">
            Tenants who want to rent your properties. Contact them directly, negotiate, then assign or reject.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#0052CC]" size={36} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList size={48} className="text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-500 mb-2">No Booking Requests Yet</h2>
          <p className="text-gray-400 text-sm max-w-xs">
            When tenants click "Book the Property" on your listings, their contact details will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([propId, propBookings]) => {
            const prop = (propBookings[0] as any).propertyId;
            return (
              <div key={propId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Property Header */}
                <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    {prop?.listingImages?.[0] ? (
                      <img src={prop.listingImages[0]} alt={prop.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={22} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-[#1F2937] text-sm">{prop?.address || "Property"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {prop?.city} · {prop?.bhk} BHK ·
                      ₹{Number(prop?.rentAmount || 0).toLocaleString("en-IN")}/mo
                    </p>
                  </div>
                  <span className="ml-auto bg-blue-50 text-[#0052CC] text-xs font-black px-3 py-1 rounded-full">
                    {(propBookings as any[]).length} request{(propBookings as any[]).length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Booking Cards */}
                <div className="divide-y divide-gray-50">
                  {(propBookings as any[]).map((booking: any) => {
                    const isProcessing = actionLoading?.startsWith(booking._id);
                    const isAssigned = booking.status === "pending_payment";
                    return (
                      <div key={booking._id} className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Tenant Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#0052CC]/10 rounded-xl flex items-center justify-center font-black text-[#0052CC] uppercase text-lg flex-shrink-0">
                              {booking.tenantContact?.name?.charAt(0) || "T"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-black text-[#1F2937] text-sm">{booking.tenantContact?.name}</p>
                                {isAssigned && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    ✓ Assigned
                                  </span>
                                )}
                                {booking.status === "pending" && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    New Request
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <Phone size={11} /> {booking.tenantContact?.phone}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Mail size={11} /> {booking.tenantContact?.email}
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-300 font-bold mt-2 uppercase tracking-widest">
                                Requested {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {booking.status === "pending" && (
                              <>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("assign", booking._id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] text-white rounded-xl font-bold text-xs hover:bg-[#0041a3] transition-colors disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                  Assign Property
                                </button>
                                <button
                                  disabled={!!isProcessing}
                                  onClick={() => doAction("reject", booking._id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            )}
                            {isAssigned && (
                              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs flex items-center gap-1.5">
                                <CheckCircle size={13} /> Waiting for tenant payment
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
