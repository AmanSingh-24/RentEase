"use client";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CreditCard, Home } from "lucide-react";

declare var Razorpay: any; // Allow TS to recognize the global Razorpay object

export default function OnboardingPayment() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch authenticated user from session
        const meRes = await fetch(`/api/auth/me`);
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        const userId = meData.user?._id;

        if (userId) {
          console.log("Fetching property for Tenant ID:", userId);
          
          const propRes = await fetch(`/api/properties/tenant-view`);
          const propData = await propRes.json();

          setData({ 
            user: meData.user, 
            property: propData.property 
          });
        } else {
          console.error("User ID not found in session");
        }
      } catch (err) {
        console.error("Onboarding Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F9FAFB]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  // ✅ NEW: Handle case where property is missing from the database
  if (!data?.property) return (
    <div className="h-screen flex flex-col items-center justify-center p-10 text-center">
      <Home size={48} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold">No Property Linked</h2>
      <p className="text-gray-400 mt-2">We couldn't find a property associated with your invite code.</p>
      <button onClick={() => window.location.href = "/onboarding/invite-code"} className="mt-6 text-blue-600 font-bold">Try Re-entering Invite Code</button>
    </div>
  );

  // ✅ CALCULATE PRORATED RENT
  let calculatedRent = data?.property?.rentAmount || 0;
  let isProrated = false;
  let activeDays = 0;
  let totalDaysInMonth = 0;
  let leaseDate: Date | null = null;

  if (data?.property?.leaseStartDate) {
    leaseDate = new Date(data.property.leaseStartDate);
    const now = new Date(); // Or technically the month they are joining. Typically they join immediately.
    
    // Prorate for the current month
    totalDaysInMonth = new Date(leaseDate.getFullYear(), leaseDate.getMonth() + 1, 0).getDate();
    const startDay = leaseDate.getDate();
    activeDays = totalDaysInMonth - startDay + 1;

    // Only prorate if they are not moving in on the 1st
    if (startDay > 1) {
      const dailyRate = data.property.rentAmount / totalDaysInMonth;
      calculatedRent = Math.round(dailyRate * activeDays);
      isProrated = true;
    }
  }

  const totalAmount = (data?.property?.depositAmount || 0) + calculatedRent;

  const handleRealPayment = async () => {
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: totalAmount, 
          receiptId: `onboarding_${data.user._id || data.user.id}` 
        }),
      });
      
      const orderData = await orderRes.json();
      console.log("Verified Order Data from Backend:", orderData);

      if (!orderData.id) {
        alert("Failed to initialize payment order.");
        return;
      }

      // 2. Configure Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, // Paisa from backend
        currency: orderData.currency || "INR",
        name: "RentEase Vault",
        description: "Onboarding Settlement",
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payments/verify-onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user._id || data.user.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              proratedRent: calculatedRent // pass it down
            }),
          });

          if (verifyRes.ok) {
            window.location.href = "/dashboard-tenant";
          } else {
            const err = await verifyRes.json();
            alert(err.error || "Verification failed.");
          }
        },
        prefill: {
          name: data.user.name,
          email: data.user.email,
          contact: "9999999999", // Recommended for Test Mode
        },
        theme: { color: "#0052CC" },
        modal: {
          ondismiss: function() {
            console.log("Checkout modal closed");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment Step Error:", err);
      alert("Something went wrong with the payment gateway.");
    }
  };
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F9FAFB]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <>
 
      <div className="p-10 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-black text-[#1F2937] mb-4">Initialize Residency Vault</h1>
        <div className="bg-white border rounded-[48px] p-10 shadow-sm space-y-6">
          
          {/* ✅ Use Optional Chaining (?.) for extra safety */}
          <div className="flex justify-between text-lg font-bold border-b pb-4">
             <span>Security Deposit</span>
             <span>₹{data.property?.depositAmount?.toLocaleString() || "0"}</span>
          </div>

          <div className="border-b pb-4">
             <div className="flex justify-between text-lg font-bold">
                <span>Initial Rent</span>
                <span>₹{calculatedRent.toLocaleString()}</span>
             </div>
             {isProrated && activeDays && totalDaysInMonth && (
               <div className="mt-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="font-bold text-blue-700 mb-1">Prorated Calculation ({activeDays} days)</p>
                  <p className="text-xs">
                     You are moving in on {leaseDate!.getDate()} {leaseDate!.toLocaleString('default', { month: 'short' })}. 
                     Your rent is calculated as (₹{data.property.rentAmount} ÷ {totalDaysInMonth} days) × {activeDays} days.
                  </p>
               </div>
             )}
          </div>

          <div className="flex justify-between text-2xl font-black text-blue-600 pt-4">
             <span>Total Settlement</span>
             <span>₹{totalAmount.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={handleRealPayment}
            className="w-full py-6 bg-[#1F2937] text-white rounded-[32px] font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl"
          >
            <CreditCard size={22} /> Pay & Unlock Dashboard
          </button>
        </div>
      </div>
    </>
  );
}