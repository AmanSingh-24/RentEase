"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Pen, CheckCircle, X } from "lucide-react";

export default function OnboardingRentalsPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Signature state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signatureData, setSignatureData] = useState("");

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const bookingId = sessionStorage.getItem("bookingId");
        const paymentDone = sessionStorage.getItem("paymentDone");
        if (!bookingId || paymentDone !== "true") {
          // Payment wasn't completed — send back
          router.replace("/dashboard/onboarding-payment");
          return;
        }

        const res = await fetch("/api/bookings/tenant");
        const data = await res.json();
        if (!res.ok || !data.booking) { router.replace("/"); return; }

        const b = data.booking;
        const propStatus = b.propertyId?.status;
        if (propStatus === "waiting_payment_approval") { router.replace("/dashboard/onboarding-approvals"); return; }
        if (propStatus === "occupied") { router.replace("/dashboard-tenant"); return; }
        if (b.status !== "pending_payment") { router.replace("/"); return; }

        setBooking(b);
        setProperty(b.propertyId);
      } catch {
        router.replace("/dashboard/onboarding-payment");
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [router]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0052CC";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsSigning(true);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    const onEnd = () => {
      drawing = false;
      setHasSigned(true);
      setSignatureData(canvas.toDataURL());
    };

    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);

    return () => {
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [loading]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    setSignatureData("");
    setIsSigning(false);
  };

  const handleSubmit = async () => {
    if (!hasSigned || !signatureData) {
      setError("Please sign the rental agreement before submitting.");
      return;
    }
    const bookingId = sessionStorage.getItem("bookingId");
    if (!bookingId) {
      router.replace("/dashboard/onboarding-payment");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, signatureData }),
      });
      const data = await res.json();
      if (res.ok) {
        // Clear session flags
        sessionStorage.removeItem("bookingId");
        sessionStorage.removeItem("paymentDone");
        router.replace("/dashboard/onboarding-approvals");
      } else {
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0052CC]" size={40} />
    </div>
  );

  if (!property) return null;

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#0052CC] uppercase tracking-widest">Step 2 of 2</p>
            <h1 className="text-lg font-black text-[#1F2937]">Rental Agreement</h1>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-2 bg-[#10B981] rounded-full" />
            <div className="w-8 h-2 bg-[#0052CC] rounded-full" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Agreement Document */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#1F2937] px-6 py-4 flex items-center gap-3">
            <FileText size={20} className="text-white" />
            <div>
              <p className="text-white font-black text-sm">Rental Agreement</p>
              <p className="text-gray-400 text-xs">{today}</p>
            </div>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4 font-mono">
            <p className="font-black text-[#1F2937] text-base not-italic">RENTAL AGREEMENT</p>
            <p>This Rental Agreement is entered into on <strong>{today}</strong>, between the Owner of the property and the Tenant.</p>
            <p><strong>Property:</strong> {property.address}, {property.city}</p>
            <p><strong>Type:</strong> {property.bhk} BHK</p>
            <p><strong>Monthly Rent:</strong> ₹{Number(property.rentAmount).toLocaleString("en-IN")}</p>
            <p><strong>Security Deposit:</strong> ₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}</p>
            <p><strong>Lease Start Date:</strong> {today}</p>
            <p><strong>Lock-in Period:</strong> {property.exitPolicy?.lockInMonths || 11} months</p>
            <p><strong>Notice Period:</strong> {property.exitPolicy?.noticePeriodDays || 30} days</p>
            <p><strong>Maintenance Threshold:</strong> Repairs below ₹{property.maintenanceRules?.repairThreshold || 500} are the tenant's responsibility.</p>
            <hr className="border-gray-200" />
            <p className="text-xs text-gray-400">By signing below, the Tenant agrees to all terms of this rental agreement, including timely rent payment, property upkeep, and compliance with all house rules. This agreement is legally binding and enforced by RentEase digital documentation.</p>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-[#1F2937] flex items-center gap-2">
              <Pen size={18} className="text-[#0052CC]" /> Your Signature
            </h3>
            {hasSigned && (
              <button onClick={clearSignature} className="text-xs text-gray-400 flex items-center gap-1 hover:text-red-500 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative bg-gray-50 hover:border-[#0052CC] transition-colors">
            <canvas
              ref={canvasRef}
              width={560}
              height={160}
              className="w-full cursor-crosshair touch-none"
            />
            {!isSigning && !hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm font-medium">✍️ Draw your signature here</p>
              </div>
            )}
          </div>
          {hasSigned && (
            <div className="mt-3 flex items-center gap-2 text-[#10B981] text-sm font-bold">
              <CheckCircle size={16} /> Signature captured
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !hasSigned}
          className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-black text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Submitting..." : "Submit Payment & Sign Agreement ✓"}
        </button>

        <p className="text-center text-xs text-gray-400">
          By submitting, you confirm payment has been made and you agree to all rental terms.
        </p>
      </div>
    </div>
  );
}
