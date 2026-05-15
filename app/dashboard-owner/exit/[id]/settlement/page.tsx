"use client";

import React, { useState, useEffect } from "react";
import { 
  Calculator, Plus, Trash2, ArrowRight, Loader2, DollarSign, 
  ChevronLeft, CheckCircle2, MessageSquareWarning, Clock, ShieldCheck,
  AlertTriangle, Info
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

        // 🛡️ AUTO-INJECT: 11-Month Lock-in Check
        // Only inject if this is the first time opening the settlement (status === inspection_completed)
        if (result.exit.status === "inspection_completed") {
          const leaseStart = new Date(result.property.leaseStartDate);
          const moveOut = new Date(result.exit.moveOutDate);
          const monthsDiff = (moveOut.getFullYear() - leaseStart.getFullYear()) * 12 + (moveOut.getMonth() - leaseStart.getMonth());

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
          // If already saved or disputed, load the existing data
          setDeductions(result.exit.deductions);
        }
      }
    } catch (err) {
      console.error("Failed to load settlement details", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations ---
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const finalRefund = Math.max(0, deposit - totalDeductions);

  // --- Handlers ---
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
    // Simulate Razorpay/Bank transfer delay
    setTimeout(async () => {
      try {
        const res = await fetch("/api/exit/respond-notice", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exitId, status: "settled" }) // Logic to trigger the 'Paid' screen
        });
        if (res.ok) router.push("/dashboard-owner/exit");
      } finally {
        setIsProcessing(false);
      }
    }, 3000);
  };

  if (loading || !data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const isApproved = data.exit.isTenantSatisfied;
  const isDisputed = data.exit.status === "disputed";
  const isWaiting = data.exit.status === "settled" && !isApproved;

  return (
    <div className="p-10 max-w-5xl mx-auto relative min-h-screen pb-60">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-400 hover:text-black mb-4 transition-colors font-bold text-xs uppercase tracking-widest"><ChevronLeft size={16} /> Back</button>
          <h1 className="text-4xl font-black text-[#1F2937] tracking-tight italic">Final Settlement</h1>
          <p className="text-gray-400 mt-2 font-medium">Reconciling ledger for <span className="text-black font-bold">{data?.property?.address}</span>.</p>
        </div>
        
        {isApproved ? (
            <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tenant Approved Amount</span>
            </div>
        ) : isWaiting ? (
            <div className="bg-blue-50 border border-blue-100 px-6 py-4 rounded-2xl flex items-center gap-3 animate-pulse">
                <Clock className="text-blue-500" size={20} />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Awaiting Signature</span>
            </div>
        ) : null}
      </header>

      {/* 🔴 DISPUTE NOTIFICATION */}
      {isDisputed && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 p-8 rounded-[40px] flex items-start gap-8 mb-12 shadow-sm">
           <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-red-500 shadow-sm"><MessageSquareWarning size={32}/></div>
           <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Tenant Dispute Received</p>
              <h3 className="text-xl font-bold text-red-900">Re-calculation Requested</h3>
              <p className="text-red-700/70 mt-2 italic font-medium">"{data.exit.tenantDisputeComment}"</p>
              <p className="text-[10px] font-bold text-red-400 mt-6 uppercase">Action: Review the comment, adjust the prices, and re-send.</p>
           </div>
        </motion.div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="p-10 bg-gray-50 rounded-[48px] border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Original Deposit</p>
          <h2 className="text-4xl font-black text-gray-800">₹{deposit.toLocaleString()}</h2>
        </div>
        <div className={`p-10 rounded-[48px] border flex flex-col items-center justify-center transition-all ${totalDeductions > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${totalDeductions > 0 ? 'text-red-400' : 'text-gray-400'}`}>Total Adjustments</p>
          <h2 className={`text-4xl font-black ${totalDeductions > 0 ? 'text-red-600' : 'text-gray-300'}`}>- ₹{totalDeductions.toLocaleString()}</h2>
        </div>
      </div>

      {/* DEDUCTION BUILDER */}
      <div className={`bg-white border border-gray-100 rounded-[56px] p-12 shadow-sm space-y-10 transition-all ${isWaiting ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <div className="flex justify-between items-center px-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Line-Item Adjustments</h3>
          {!isApproved && (
            <button onClick={addDeduction} className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Plus size={20} /></button>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {deductions.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-6 items-start group">
                <div className="flex-1 space-y-3">
                   <input 
                    placeholder="Reason (e.g. Wall Damage)" 
                    className="w-full p-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
                    value={d.item}
                    onChange={(e) => updateDeduction(i, "item", e.target.value)}
                  />
                  <textarea 
                    placeholder="Provide context for the tenant..." 
                    className="w-full px-6 py-2 bg-transparent text-[10px] font-medium text-gray-400 border-none outline-none resize-none"
                    value={d.reason}
                    rows={1}
                    onChange={(e) => updateDeduction(i, "reason", e.target.value)}
                  />
                </div>
                <div className="relative w-48">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-12 pr-6 py-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-black focus:bg-white focus:border-blue-100 outline-none"
                    value={d.amount}
                    onChange={(e) => updateDeduction(i, "amount", e.target.value)}
                  />
                </div>
                {!isApproved && (
                  <button onClick={() => removeDeduction(i)} className="p-6 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 💳 STICKY ACTION BAR */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-10 z-50">
        {!isApproved ? (
          <button 
            onClick={handleFinalize}
            disabled={isProcessing || isWaiting}
            className={`w-full py-8 rounded-[32px] font-black text-sm shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 ${
              isWaiting ? 'bg-gray-100 text-gray-400 border cursor-not-allowed' : 'bg-[#1F2937] text-white hover:bg-black'
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : (
              <>
                {isDisputed ? "Update & Re-send Statement" : isWaiting ? "Statement Pending Review" : "Send Final Statement"}
                {!isWaiting && <ArrowRight />}
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={handleReleasePayout}
            disabled={isProcessing}
            className="w-full py-8 bg-emerald-500 text-white rounded-[32px] font-black text-sm shadow-2xl flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all active:scale-95"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <>Release Refund: ₹{finalRefund.toLocaleString()} <ShieldCheck/></>}
          </button>
        )}
      </div>

      {/* 🚀 BANKING HANDSHAKE OVERLAY */}
      <AnimatePresence>
        {isProcessing && isApproved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-[#1F2937] flex flex-col items-center justify-center text-white p-12 text-center backdrop-blur-md">
            <div className="relative mb-12">
                <div className="w-32 h-32 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={32} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-4 italic">Executing Payout...</h2>
            <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">Processing the transfer of <span className="text-white font-bold">₹{finalRefund.toLocaleString()}</span> to the tenant's linked account via RentEase Secure Gateway.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}