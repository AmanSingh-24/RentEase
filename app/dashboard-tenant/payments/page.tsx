"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, BadgeCheck, IndianRupee, AlertTriangle, 
  ArrowDownCircle, CreditCard, Download, ShieldCheck,
} from "lucide-react";
import Script from "next/script";
import { motion } from "framer-motion";
import { generateReceipt } from "@/lib/generateReceipt"; // Ensure this path is correct

declare var Razorpay: any;

export default function TenantLedger() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingMonth, setPayingMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/payments/ledger?userId=${userId}`);
      const d = await res.json();
      if (res.ok) setData(d);
    } catch (err) {
      console.error("Ledger sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (item: any) => {
    setPayingMonth(item.month);
    try {
      // 1. Create Razorpay Order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: item.amount, 
          receiptId: `rent_${item.month}_${item.year}_${localStorage.getItem("userId")}` 
        }),
      });
      const orderData = await orderRes.json();

      // 2. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "RentEase Vault",
        description: `Rent for ${item.month} ${item.year}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payments/verify-rent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: localStorage.getItem("userId"),
              month: item.month,
              year: item.year,
              
              // ✅ FIXED: Explicitly naming keys to match Mongoose 'Required' fields
              totalAmountPaid: Number(item.amount), 
              baseRent: Number(item.breakdown?.base || data.property.rentAmount),
              maintenanceCredit: Number(item.breakdown?.credit || 0),
              penaltyApplied: Number(item.breakdown?.penalty || 0),
              
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            alert("Payment Secured & Verified!");
            fetchLedger(); // Refresh UI to show 'Audit Cleared'
          } else {
            const errData = await verifyRes.json();
            console.error("Verification Error:", errData.error);
            alert(`Validation Failed: ${errData.error}`);
          }
        },
        prefill: { 
            email: localStorage.getItem("userEmail") || "",
            name: localStorage.getItem("userName") || ""
        },
        theme: { color: "#1F2937" },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Gateway Error. Please try again.");
    } finally {
      setPayingMonth(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#0052CC]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Financial Records...</p>
    </div>
  );

  return (
    <>
      <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#1F2937] tracking-tight italic">Financial Ledger</h1>
            <p className="text-gray-400 font-medium mt-2 uppercase text-[10px] tracking-[0.2em]">Automated Auditing & Maintenance Credits</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
             <div>
               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Vault Status</p>
               <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Excellent</p>
             </div>
             <div className="w-px h-8 bg-gray-100" />
             <ShieldCheck className="text-emerald-500" size={24} />
          </div>
        </header>

        <div className="space-y-6">
          {data?.ledger.map((item: any, i: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className={`p-8 rounded-[48px] border transition-all ${
                item.status === 'Paid' 
                  ? 'bg-white border-gray-100 shadow-sm' 
                  : 'bg-blue-50/40 border-blue-100 shadow-xl shadow-blue-900/5'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                <div className="shrink-0">
                  <h3 className="text-3xl font-black text-[#1F2937] leading-none">{item.month}</h3>
                  <p className="text-lg font-bold text-gray-400 mt-1 italic">{item.year}</p>
                  <div className="flex gap-3 mt-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#1F2937] text-white'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.status === "Pending" && item.breakdown && (
                  <div className="flex-1 w-full max-w-md space-y-3 bg-white p-6 rounded-[32px] border border-blue-100 shadow-inner">
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                      <span>Standard Rent</span>
                      <span>₹{(item.breakdown.base || 0).toLocaleString()}</span>
                    </div>
                    
                    {item.breakdown.credit > 0 && (
                      <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase italic">
                        <span className="flex items-center gap-1.5"><ArrowDownCircle size={12}/> Repair Credit</span>
                        <span>- ₹{item.breakdown.credit.toLocaleString()}</span>
                      </div>
                    )}

                    {item.breakdown.penalty > 0 && (
                      <div className="flex justify-between text-[11px] font-black text-red-500 uppercase">
                        <span className="flex items-center gap-1.5"><AlertTriangle size={12}/> Late Penalty (Tier 2)</span>
                        <span>+ ₹{item.breakdown.penalty.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Amount</span>
                      <span className="text-3xl font-black text-blue-700 tracking-tighter">₹{(item.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="w-full lg:w-auto">
                  {item.status === "Paid" ? (
                    <div className="flex items-center gap-4">
                      <div className="px-8 py-5 bg-emerald-50 text-emerald-600 rounded-[24px] border border-emerald-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                        <BadgeCheck size={18}/> Audit Cleared
                      </div>
                      <button 
                        onClick={() => generateReceipt(item, data.property, localStorage.getItem("userName") || "Tenant")}
                        className="p-5 bg-gray-50 rounded-[24px] text-gray-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handlePayment(item)}
                      disabled={payingMonth === item.month}
                      className="w-full lg:w-auto px-12 py-6 bg-[#1F2937] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-300 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-black disabled:opacity-50"
                    >
                      {payingMonth === item.month ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
                      {payingMonth === item.month ? "Processing Vault..." : "Pay Monthly Invoice"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}