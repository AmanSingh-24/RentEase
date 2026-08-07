"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, IndianRupee, MapPin,
  ShieldCheck, Lock, CheckCircle, AlertCircle,
} from "lucide-react";

// ── Razorpay global type ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;

export default function OnboardingPaymentPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [tenantUser, setTenantUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  // ── Load Razorpay SDK script ─────────────────────────────────────────────
  const loadRazorpay = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // ── Fetch booking + session ──────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [bookingRes, meRes] = await Promise.all([
          fetch("/api/bookings/tenant"),
          fetch("/api/auth/me"),
        ]);
        const bookingData = await bookingRes.json();
        const meData = await meRes.json();

        if (!bookingRes.ok || !bookingData.booking) { router.replace("/"); return; }

        const b = bookingData.booking;
        const propStatus = b.propertyId?.status;

        // Route guards
        if (propStatus === "waiting_payment_approval") { router.replace("/dashboard/onboarding-approvals"); return; }
        if (propStatus === "occupied") { router.replace("/dashboard-tenant"); return; }
        if (b.status !== "pending_payment") { router.replace("/"); return; }

        setBooking(b);
        setProperty(b.propertyId);
        if (meRes.ok && meData.user) setTenantUser(meData.user);
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // ── Razorpay checkout flow ───────────────────────────────────────────────
  const handlePay = async () => {
    setError("");
    setPaying(true);

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      setError("Failed to load payment gateway. Please check your connection.");
      setPaying(false);
      return;
    }

    const totalAmount = calculatedRent + Number(property.depositAmount || 0);

    try {
      // 1. Create Razorpay order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          // Razorpay receipt max = 40 chars
          // "bk_" + last 10 of ObjectId + "_" + last 8 of timestamp = 22 chars
          receiptId: `bk_${booking._id.toString().slice(-10)}_${Date.now().toString().slice(-8)}`,
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok || !order.id) {
        setError("Could not create payment order. Please try again.");
        setPaying(false);
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "RentEase",
        description: `Deposit + 1st Month Rent — ${property.address}`,
        order_id: order.id,
        prefill: {
          name: tenantUser?.name || booking.tenantContact?.name,
          email: tenantUser?.email || booking.tenantContact?.email,
          contact: booking.tenantContact?.phone,
        },
        theme: { color: "#0052CC" },
        handler: async (response: any) => {
          // 3. Verify payment on server → create Payment records
          const verifyRes = await fetch("/api/bookings/verify-onboarding-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              proratedRent: calculatedRent, // Pass prorated amount
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            // Store bookingId + payment confirmation for the signature step
            sessionStorage.setItem("bookingId", booking._id);
            sessionStorage.setItem("paymentDone", "true");
            router.push("/dashboard/onboarding-rentals");
          } else {
            setError(verifyData.error || "Payment verification failed. Contact support.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError("Payment was cancelled. You can try again.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#0052CC]" size={40} />
    </div>
  );
  if (!property) return null;

  // ✅ CALCULATE PRORATED RENT
  let calculatedRent = Number(property.rentAmount || 0);
  let isProrated = false;
  let activeDays = 0;
  let totalDaysInMonth = 0;
  
  // Use leaseStartDate if set, otherwise assume tenancy begins today
  let leaseDate: Date = property.leaseStartDate ? new Date(property.leaseStartDate) : new Date();

  totalDaysInMonth = new Date(leaseDate.getFullYear(), leaseDate.getMonth() + 1, 0).getDate();
  const startDay = leaseDate.getDate();
  activeDays = totalDaysInMonth - startDay + 1;

  if (startDay > 1) {
    const dailyRate = property.rentAmount / totalDaysInMonth;
    calculatedRent = Math.round(dailyRate * activeDays);
    isProrated = true;
  }

  const deposit = Number(property.depositAmount || 0);
  const total = calculatedRent + deposit;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Step header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#0052CC] uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-lg font-black text-[#1F2937]">Payment</h1>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-2 bg-[#0052CC] rounded-full" />
            <div className="w-8 h-2 bg-gray-200 rounded-full" />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Property mini-card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {property.listingImages?.[0] && (
            <img
              src={property.listingImages[0]}
              alt={property.address}
              className="w-full h-36 object-cover"
            />
          )}
          <div className="p-4">
            <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-wider mb-1">
              Your Assigned Property
            </p>
            <h2 className="text-base font-black text-[#1F2937]">{property.address}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {property.city} · {property.bhk} BHK
            </p>
          </div>
        </div>

        {/* Payment breakdown card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="bg-[#1F2937] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-white" />
              <span className="text-white font-black text-sm">Move-in Payment</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <Lock size={10} /> 256-bit SSL
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Breakdown rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">Security Deposit</p>
                  <p className="text-xs text-gray-400">Refundable at end of tenancy</p>
                </div>
                <span className="font-bold text-[#1F2937]">
                  ₹{deposit.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">First Month Rent</p>
                  <p className="text-xs text-gray-400">
                    {leaseDate ? `${leaseDate.toLocaleString("default", { month: "long" })} ${leaseDate.getFullYear()}` : "First Month"}
                  </p>
                </div>
                <span className="font-bold text-[#1F2937]">
                  ₹{calculatedRent.toLocaleString("en-IN")}
                </span>
              </div>
              
              {isProrated && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-blue-700 mb-1">Prorated Rate ({activeDays} days)</p>
                  <p className="text-[10px] text-blue-600/80 leading-relaxed">
                    Moving in on {leaseDate!.getDate()} {leaseDate!.toLocaleString('default', { month: 'short' })}. 
                    Calculated as (₹{property.rentAmount} ÷ {totalDaysInMonth} days) × {activeDays} days.
                  </p>
                </div>
              )}

              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="font-black text-[#1F2937]">Total</span>
                <div className="text-right">
                  <p className="font-black text-2xl text-[#0052CC]">
                    ₹{total.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-gray-400">incl. deposit + rent</p>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-[#0052CC] font-medium leading-relaxed">
              💳 Secure payment via Razorpay. Pay using UPI, Credit/Debit card, or Net Banking.
              Your payment details are <strong>never stored</strong> on our servers.
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-4 bg-[#0052CC] text-white rounded-2xl font-black text-sm hover:bg-[#0041a3] active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {paying ? (
                <><Loader2 size={16} className="animate-spin" /> Opening Payment Gateway...</>
              ) : (
                <><Lock size={14} /> Pay ₹{total.toLocaleString("en-IN")} Securely</>
              )}
            </button>

            {/* Trust row */}
            <div className="flex items-center justify-center gap-5">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                <ShieldCheck size={11} className="text-[#10B981]" /> Razorpay Secured
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                <CheckCircle size={10} className="text-[#10B981]" /> Instant Verification
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          After payment, you'll proceed to sign the rental agreement digitally.
          Your tenancy begins once the owner reviews and approves.
        </p>
      </div>
    </div>
  );
}
