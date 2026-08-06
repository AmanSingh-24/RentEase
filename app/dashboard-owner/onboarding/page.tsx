"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Users, CheckCircle, Loader2, RefreshCw, MapPin,
  Home, ShieldCheck, IndianRupee, CreditCard, FileCheck, Signature, XCircle, Eraser
} from "lucide-react";

type OnboardTab = "pending" | "completed";

export default function OwnerOnboardingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<OnboardTab>("pending");

  // Signatures State per propertyId
  const [signingPropertyId, setSigningPropertyId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // If we are looking at completed ones, fetch occupied properties
      const endpoint = activeTab === "pending" 
        ? "/api/bookings/pending-approval"
        : "/api/properties/get"; // Fetch all properties and filter occupied
      
      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (res.ok) {
        if (activeTab === "pending") {
          setItems(data.items || []);
        } else {
          // Format occupied properties to match item structure
          const occupiedProps = (data.properties || [])
            .filter((p: any) => p.status === "occupied" && p.tenantId)
            .map((p: any) => ({
              property: p,
              booking: { status: "active" },
              payments: [
                { type: "deposit", totalAmountPaid: p.depositAmount, status: "completed", gatewayTransactionId: "razorpay_mock_id" },
                { type: "rent", totalAmountPaid: p.rentAmount, status: "completed", gatewayTransactionId: "razorpay_mock_id" }
              ]
            }));
          setItems(occupiedProps);
        }
      } else {
        showToast(data.error || "Failed to load", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Drawing Canvas Methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApprove = async (propertyId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      showToast("Please open the signature box first.", "error");
      return;
    }

    // Convert drawn signature canvas to base64
    const ownerSignature = canvas.toDataURL("image/png");
    
    // Quick validation check on empty canvas representation
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (ownerSignature === blank.toDataURL("image/png")) {
      showToast("Please sign the agreement canvas before approving.", "error");
      return;
    }

    setActionLoading(propertyId);
    try {
      const res = await fetch("/api/bookings/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, ownerSignature }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Tenant onboarded successfully! Signed agreement moved to Document Vault.", "success");
        setSigningPropertyId(null);
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
            Customer Onboarding
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Verify automated payment logs, examine legal agreements, and sign with canvas to grant residency dashboard access.
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all shadow-2xs active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Onboarding Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-2xl w-fit border border-neutral-200/50 shadow-3xs">
        {[
          { id: "pending", label: "Awaiting Action" },
          { id: "completed", label: "Onboarded History" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSigningPropertyId(null);
                setActiveTab(tab.id as OnboardTab);
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

      {/* ── Content Viewport ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neutral-950" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
          <Users size={40} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900 mb-1">
            No onboarding files found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Once tenants complete lease payments and signature steps, they will show up here for your counter-signature verification.
          </p>
        </div>
      ) : (
        <div
          className={
            activeTab === "completed"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-6"
          }
        >
          {items.map(({ property, booking, payments = [] }) => {
            const hasLeaseSigned = property.agreement?.isSignedByTenant;
            const tenantSignatureImage = property.agreement?.blockchainHash;
            
            // Gather payment details (Razorpay automated logs)
            const depositPayment = payments.find((p: any) => p.type === "deposit");
            const rentPayment = payments.find((p: any) => p.type === "rent");

            const isAwaitingAction = activeTab === "pending";

            if (!isAwaitingAction) {
              // Premium square card layout for onboarded history
              return (
                <div
                  key={property._id}
                  className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between h-full relative"
                >
                  <div className="space-y-4">
                    {/* Header: Tenant Badge & Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-neutral-950 text-white rounded-xl flex items-center justify-center font-black uppercase text-xs shrink-0">
                        {property.tenantId?.name?.charAt(0) || "T"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-neutral-900 text-xs truncate leading-snug">
                          {property.tenantId?.name || "Onboarded Tenant"}
                        </h4>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 mt-0.5 inline-block">
                          ✓ Active Tenancy
                        </span>
                      </div>
                    </div>

                    {/* Body Details: Address, Email, Phone */}
                    <div className="space-y-1.5 text-xs text-neutral-500 font-medium border-t border-neutral-100/70 pt-3">
                      <p className="truncate text-neutral-800">📍 {property.address}</p>
                      <p className="truncate">✉️ {property.tenantId?.email || "No Email linked"}</p>
                      <p className="truncate">📞 {booking?.tenantContact?.phone || "No Phone linked"}</p>
                    </div>

                    {/* Rent & Deposit parameters */}
                    <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/40">
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Monthly Rent</p>
                        <p className="text-xs font-black text-neutral-900 mt-0.5">
                          ₹{Number(property.rentAmount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Security Deposit</p>
                        <p className="text-xs font-black text-neutral-900 mt-0.5">
                          ₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Right: Date */}
                  <div className="mt-4 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-bold">Residency Record</span>
                    <span className="text-[10px] text-neutral-500 font-extrabold">
                      {property.leaseStartDate ? new Date(property.leaseStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Live"}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={property._id}
                className="bg-white rounded-2xl border border-neutral-200/85 shadow-2xs overflow-hidden"
              >
                {/* Header detail */}
                <div className="p-4 bg-neutral-50/50 border-b border-neutral-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                      {property.listingImages?.[0] ? (
                        <img src={property.listingImages[0]} alt={property.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                          <Home size={18} className="text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-neutral-950 text-sm">{property.address}</p>
                      <p className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} className="text-neutral-400" /> {property.city} · {property.bhk || 1} BHK
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xs font-bold text-neutral-900">
                      Rent: <span className="text-emerald-600 font-black">₹{Number(property.rentAmount || 0).toLocaleString("en-IN")}</span> ·
                      Deposit: <span className="text-neutral-950 font-black">₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}</span>
                    </p>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        isAwaitingAction
                          ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                      }`}
                    >
                      {isAwaitingAction ? "⏳ Awaiting Approval" : "Onboarded"}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Tenant Profile details */}
                  <div className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60 w-fit min-w-[280px]">
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-black uppercase">
                      {property.tenantId?.name?.charAt(0) || "T"}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-neutral-950">{property.tenantId?.name || "Tenant"}</p>
                      <p className="text-[10px] text-neutral-500 font-semibold">{property.tenantId?.email}</p>
                    </div>
                    <ShieldCheck size={18} className="ml-auto text-emerald-600" />
                  </div>

                  {/* Payment Verification Logs */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-neutral-900 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-neutral-500" /> Payment logs (Razorpay Settlement)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Security Deposit log card */}
                      <div className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-3xs relative overflow-hidden">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Deposit Payment</p>
                        <p className="text-base font-black text-neutral-900 mt-1">
                          ₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}
                        </p>
                        {depositPayment || !isAwaitingAction ? (
                          <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> Settlement Complete
                          </div>
                        ) : (
                          <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Verifying gateway status...
                          </div>
                        )}
                        {depositPayment?.gatewayTransactionId && (
                          <p className="text-[9px] text-neutral-400 font-mono mt-1 select-all">
                            TXID: {depositPayment.gatewayTransactionId}
                          </p>
                        )}
                      </div>

                      {/* First Month Rent log card */}
                      <div className="p-4 bg-white rounded-xl border border-neutral-200/80 shadow-3xs relative overflow-hidden">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">First Month Rent</p>
                        <p className="text-base font-black text-neutral-900 mt-1">
                          ₹{Number(property.rentAmount || 0).toLocaleString("en-IN")}
                        </p>
                        {rentPayment || !isAwaitingAction ? (
                          <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> Settlement Complete
                          </div>
                        ) : (
                          <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Verifying gateway status...
                          </div>
                        )}
                        {rentPayment?.gatewayTransactionId && (
                          <p className="text-[9px] text-neutral-400 font-mono mt-1 select-all">
                            TXID: {rentPayment.gatewayTransactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Legal Signature Logs */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-extrabold text-neutral-900 flex items-center gap-1.5">
                      <FileCheck size={14} className="text-neutral-500" /> Digital Lease Agreement
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tenant Signature Preview */}
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Tenant Signature</p>
                        {hasLeaseSigned && tenantSignatureImage ? (
                          <div className="space-y-2">
                            <div className="border border-neutral-200 bg-white p-2 rounded-lg max-h-16 flex items-center justify-center overflow-hidden">
                              <img src={tenantSignatureImage} alt="Tenant signature" className="max-h-12 object-contain" />
                            </div>
                            <p className="text-[9px] text-neutral-400 font-bold">
                              ✓ Signed on {property.agreement?.signedAt ? new Date(property.agreement.signedAt).toLocaleDateString("en-IN") : "Verification step"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-red-500 font-semibold">Tenant signature missing from lease.</p>
                        )}
                      </div>

                      {/* Landlord Signature Canvas drawing box */}
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Host Signature (You)</p>
                        {isAwaitingAction ? (
                          signingPropertyId === property._id ? (
                            <div className="space-y-2">
                              <div className="relative border border-neutral-300 rounded-lg overflow-hidden bg-white h-24">
                                <canvas
                                  ref={canvasRef}
                                  width={280}
                                  height={96}
                                  onMouseDown={startDrawing}
                                  onMouseMove={draw}
                                  onMouseUp={stopDrawing}
                                  onMouseLeave={stopDrawing}
                                  onTouchStart={startDrawing}
                                  onTouchMove={draw}
                                  onTouchEnd={stopDrawing}
                                  className="w-full h-full cursor-crosshair touch-none"
                                />
                                <button
                                  onClick={clearCanvas}
                                  className="absolute top-1 right-1 p-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-md transition-all cursor-pointer"
                                  title="Clear canvas drawing"
                                >
                                  <Eraser size={11} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-neutral-400 font-semibold">Draw signature inside canvas</span>
                                <button
                                  onClick={() => setSigningPropertyId(null)}
                                  className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                                >
                                  Cancel signature box
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSigningPropertyId(property._id);
                                // Allow state rendering cycle to complete before accessing canvas
                                setTimeout(() => {
                                  if (canvasRef.current) {
                                    const ctx = canvasRef.current.getContext("2d");
                                    if (ctx) {
                                      ctx.fillStyle = "#ffffff";
                                      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                    }
                                  }
                                }, 100);
                              }}
                              className="w-full py-4 border border-dashed border-neutral-300 hover:border-neutral-900 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-all bg-white shadow-3xs cursor-pointer"
                            >
                              <Signature size={14} /> Open Signature Canvas
                            </button>
                          )
                        ) : (
                          <div className="space-y-2">
                            <div className="border border-neutral-200 bg-white p-2 rounded-lg h-16 flex items-center justify-center overflow-hidden">
                              {property.agreement?.ownerSignature ? (
                                <img src={property.agreement.ownerSignature} alt="Owner signature" className="max-h-12 object-contain" />
                              ) : (
                                <span className="text-[10px] text-neutral-400 font-bold italic">Signed & Verified Digitally</span>
                              )}
                            </div>
                            <p className="text-[9px] text-emerald-600 font-bold">✓ Counter-signed & Live</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action approval footer */}
                  {isAwaitingAction && (
                    <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-[11px] text-neutral-400 font-bold leading-normal max-w-md">
                        Onboarding approval completes the lease verification protocol and moves co-signed document records to your Vault.
                      </p>
                      
                      <button
                        disabled={actionLoading === property._id || signingPropertyId !== property._id}
                        onClick={() => handleApprove(property._id)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 self-end"
                        title={signingPropertyId !== property._id ? "Please sign above first" : "Onboard Tenant"}
                      >
                        {actionLoading === property._id ? (
                          <><Loader2 size={13} className="animate-spin" /> Finalizing...</>
                        ) : (
                          <><CheckCircle size={13} /> Approve & Grant Access</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
