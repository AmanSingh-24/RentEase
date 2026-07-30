"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Home, ShieldCheck } from "lucide-react";

export default function OnboardingApprovalsPage() {
  const router = useRouter();

  useEffect(() => {
    // If already approved (occupied), redirect to dashboard
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/bookings/tenant");
        const data = await res.json();
        if (res.ok && data.booking) {
          const propStatus = data.booking.propertyId?.status;
          if (propStatus === "occupied") {
            router.replace("/dashboard-tenant");
            return;
          }
          if (propStatus === "pending_payment") {
            router.replace("/dashboard/onboarding-payment");
            return;
          }
        }
      } catch { /* stay on page */ }
    };
    checkStatus();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated waiting icon */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="w-32 h-32 rounded-full border-4 border-[#0052CC]/10 flex items-center justify-center bg-white shadow-xl shadow-blue-100">
            <Clock size={52} className="text-[#0052CC]" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0052CC] animate-spin" />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-black text-[#1F2937] mb-3">Awaiting Owner Verification</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your payment proof and rental agreement signature have been successfully submitted.
            The owner is reviewing your documents — this usually takes less than 24 hours.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left space-y-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Status Timeline</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Booking Accepted by Owner ✓</p>
                <p className="text-xs text-gray-400">Owner assigned this property to you</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Payment & Signature Submitted ✓</p>
                <p className="text-xs text-gray-400">Your payment proof and agreement are on file</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400">Pending: Owner Verification</p>
                <p className="text-xs text-gray-300">Once approved, you'll get instant dashboard access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 rounded-2xl text-sm text-[#0052CC] font-medium">
          🔔 No need to stay on this page. Come back anytime — if approved, clicking Dashboard will take you directly to your tenant dashboard.
        </div>

        {/* Back to home */}
        <Link href="/">
          <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <Home size={16} /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
