"use client";

import React, { useState, useEffect } from "react";
import { 
  Calculator, Plus, Trash2, ArrowRight, Loader2, DollarSign, 
  ChevronLeft, CheckCircle2, MessageSquareWarning, Clock, ShieldCheck,
  CreditCard, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function FinalSettlement({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const exitId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [deductions, setDeductions] = useState([{ item: "", amount: 0, reason: "" }]);
  const [deposit, setDeposit] = useState(0); 
  const [monthsCompleted, setMonthsCompleted] = useState(0);

  useEffect(() => {
    fetchSettlementData();
  }, [exitId]);

  const fetchSettlementData = async () => {
    try {
      const res = await fetch(`/api/exit/get-comparison?exitId=${exitId}`);
      const result = await res.json();
      
      if (res.ok && result.property) {
        setData(result);
        const depositAmount = result.property.depositAmount || 0;
        setDeposit(depositAmount);

        // 🗓️ Calculate Tenancy Tenure Months Completed
        const leaseStart = new Date(result.property.leaseStartDate);
        const moveOut = new Date(result.exit.moveOutDate);
        const monthsDiff = (moveOut.getFullYear() - leaseStart.getFullYear()) * 12 + (moveOut.getMonth() - leaseStart.getMonth());
        setMonthsCompleted(Math.max(0, monthsDiff));

        if (result.exit.status === "inspection_completed") {
          if (monthsDiff < 11) {
            setDeductions([
              { 
                item: "Early Termination Penalty", 
                amount: depositAmount, 
                reason: "Stay was less than the mandatory 11-month lock-in period." 
              }
            ]);
          }
        } else if (result.exit.deductions?.length > 0) {
          setDeductions(result.exit.deductions);
        }
      }
    } catch (err) {
      console.error("Failed to load settlement details", err);
    } finally {
      setLoading(false);
    }
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const finalRefund = Math.max(0, deposit - totalDeductions);

  const addDeduction = () => setDeductions([...deductions, { item: "", amount: 0, reason: "" }]);
  const removeDeduction = (index: number) => {
    const updated = deductions.filter((_, i) => i !== index);
    setDeductions(updated.length ? updated : [{ item: "", amount: 0, reason: "" }]);
  };
  const updateDeduction = (index: number, field: string, value: any) => {
    const updated = [...deductions];
    updated[index] = { ...updated[index], [field]: value };
    setDeductions(updated);
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/exit/finalize-settlement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          exitId, 
          deductions: deductions.filter(d => d.item !== ""), 
          finalRefundAmount: finalRefund 
        })
      });
      if (res.ok) await fetchSettlementData();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleasePayout = async () => {
    setIsProcessing(true);

    if (finalRefund === 0) {
      setTimeout(async () => {
        const res = await fetch("/api/exit/respond-notice", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exitId, status: "payout_released" })
        });
        if (res.ok) router.push("/dashboard-owner/exit");
        setIsProcessing(false);
      }, 2000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = async () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummyKey123",
        amount: finalRefund * 100,
        currency: "INR",
        name: "RentEase Escrow Gateway",
        description: "Security Deposit Discharge Payout",
        handler: async function (response: any) {
          const res = await fetch("/api/exit/respond-notice", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exitId, status: "payout_released", transactionId: response.razorpay_payment_id })
          });
          if (res.ok) router.push("/dashboard-owner/exit");
          setIsProcessing(false);
        },
        theme: { color: "#1F2937" }
      };
      const rzp = (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  if (loading || !data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const isApproved = data.exit.isTenantSatisfied;
  const isDisputed = data.exit.status === "disputed";
  const isWaiting = data.exit.status === "settled" && !isApproved;

  return (
    <div className="p-10 max-w-5xl mx-auto relative min-h-screen pb-60">
      {/* HEADER PIPELINE MONITOR */}
      <header className="mb-12 flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <button onClick={() => router.push("/dashboard-owner/exit")} className="flex items-center gap-2 text-gray-400 hover:text-black mb-2 font-bold text-xs uppercase tracking-widest transition-colors"><ChevronLeft size={16} /> Exit Inbox</button>
          <h1 className="text-3xl font-black text-[#1F2937] tracking-tight">Settlement Matrix</h1>
        </div>
        
        {/* PAYMENT SYSTEM HUB ACCORDING TO STATE MACHINE */}
        <div className="flex gap-4">
          <button 
            disabled={!isApproved || isProcessing}
            onClick={handleReleasePayout}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
              isApproved 
                ? "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95" 
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            <CreditCard size={16}/> {finalRefund === 0 ? "Release Free Discharge Handshake" : `Release Payout (₹${finalRefund})`}
          </button>
        </div>
      </header>

      {/* 🔴 ACTIVE DISPUTE BANNER FOR RE-CALCULATION LOOPS */}
      {isDisputed && (
        <div className="bg-red-50 border border-red-100 p-8 rounded-[40px] flex items-start gap-6 mb-10 shadow-sm">
           <MessageSquareWarning className="text-red-500 mt-1" size={28}/>
           <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Tenant Revision Request</p>
              <p className="text-red-950 font-bold italic">"{data.exit.tenantDisputeComment}"</p>
           </div>
        </div>
      )}

      {/* METRICS DISPATCH CARD SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Original Deposit Base</p>
          <h3 className="text-3xl font-black text-gray-800">₹{deposit.toLocaleString()}</h3>
        </div>
        <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Months Completed</p>
          <h3 className="text-3xl font-black text-blue-600">{monthsCompleted} Months</h3>
        </div>
        <div className={`p-8 rounded-[32px] border text-center transition-all ${totalDeductions > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Deductions Aggregation</p>
          <h3 className={`text-3xl font-black ${totalDeductions > 0 ? 'text-red-600' : 'text-gray-300'}`}>- ₹{totalDeductions.toLocaleString()}</h3>
        </div>
      </div>

      {/* COMPLIANCE MATRIX ADJUSTMENTS builder */}
      <div className={`bg-white border border-gray-100 rounded-[56px] p-12 shadow-sm space-y-10 transition-all ${isWaiting || isApproved ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <div className="flex justify-between items-center px-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Line-Item Adjustments Matrix</h3>
          <button onClick={addDeduction} className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Plus size={20} /></button>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {deductions.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-6 items-start group">
                <div className="flex-1 space-y-3">
                   <input 
                    placeholder="Deduction Context Item (e.g., Structural Paint Damage)" 
                    className="w-full p-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                    value={d.item}
                    onChange={(e) => updateDeduction(i, "item", e.target.value)}
                  />
                  <input 
                    placeholder="Justification statement logs..." 
                    className="w-full px-6 text-[10px] font-medium text-gray-400 bg-transparent border-none outline-none"
                    value={d.reason}
                    onChange={(e) => updateDeduction(i, "reason", e.target.value)}
                  />
                </div>
                <div className="relative w-48">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-12 pr-6 py-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-black focus:bg-white shadow-inner"
                    value={d.amount}
                    onChange={(e) => updateDeduction(i, "amount", e.target.value)}
                  />
                </div>
                <button onClick={() => removeDeduction(i)} className="p-6 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* PROPOSAL TRANSMISSION FOOTER CONTROLLER */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-10 z-50">
         {!isApproved && (
            <button 
              onClick={handleFinalize} 
              disabled={isProcessing || isWaiting} 
              className={`w-full py-8 rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all ${
                isWaiting ? 'bg-gray-50 text-gray-400 border cursor-not-allowed animate-pulse' : 'bg-[#1F2937] text-white hover:bg-black active:scale-95'
              }`}
            >
              {isProcessing ? <Loader2 className="animate-spin"/> : <>{isDisputed ? "Re-submit Updated Adjustments" : isWaiting ? "Awaiting Tenant Validation Signature..." : "Propose Final Terms to Tenant"}</>}
            </button>
         )}
      </div>

      {/* RAZORPAY SYSTEM INTERFACING BLOCK SHIELD */}
      <AnimatePresence>
        {isProcessing && isApproved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-[#1F2937] flex flex-col items-center justify-center text-white p-12 text-center backdrop-blur-md">
            <div className="relative mb-12">
                <div className="w-32 h-32 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={32} />
            </div>
            <h2 className="text-3xl font-black mb-4 italic">Handshaking Gateway Architecture...</h2>
            <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">Securing escrow dispatch parameters for <span className="text-white font-bold">₹{finalRefund.toLocaleString()}</span> to remote accounts.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}