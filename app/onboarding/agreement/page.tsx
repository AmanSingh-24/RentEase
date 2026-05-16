"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ShieldCheck, ArrowRight, Loader2, Lock } from "lucide-react";
import SignaturePad from "../../components/SignaturePad";

export default function OnboardingAgreement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch authenticated user from session
        const meRes = await fetch(`/api/auth/me`);
        if (!meRes.ok) throw new Error("Not authenticated");
        const userData = await meRes.json();
        
        // Fetch tenant's property
        const propRes = await fetch(`/api/properties/tenant-view`);
        const propData = await propRes.json();
        
        setData({ user: userData.user, property: propData.property });
      } catch (err) {
        console.error("Failed to fetch onboarding data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFinalSign = async () => {
    setIsSubmitting(true);
    // ✅ Logic: Save signature, update DB status, and generate Blockchain Hash
    const res = await fetch("/api/onboarding/sign-agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: data.property._id,
        tenantId: data.user._id,
        signatureImg: signature,
      })
    });

    if (res.ok) window.location.href = "/onboarding/payment";
    else setIsSubmitting(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F9FAFB]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 md:p-20 max-w-5xl mx-auto pb-40">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <ShieldCheck size={14}/> Step 2: Digital Contract
        </div>
        <h1 className="text-4xl font-black text-[#1F2937] tracking-tight">Rental Agreement</h1>
        <p className="text-gray-400 mt-2">Review terms and provide your digital signature to proceed.</p>
      </header>

      {/* 📄 THE "LEGAL" DOCUMENT UI */}
      <div className="bg-white border border-gray-100 shadow-2xl rounded-[48px] p-10 md:p-20 text-[#1F2937] font-serif leading-relaxed relative overflow-hidden">
        <div className="flex justify-between border-b pb-10 mb-10 items-start font-sans">
            <div>
                <h2 className="text-2xl font-black uppercase text-blue-600">RentEase Vault</h2>
                <p className="text-[10px] font-bold text-gray-400">AGREEMENT REF: {data.property._id.slice(-6).toUpperCase()}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold uppercase">Date: {new Date().toLocaleDateString()}</p>
            </div>
        </div>

        <div className="space-y-8 text-sm">
          <section>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-2">1. Parties</h3>
            <p>This agreement is made between <b>The Owner</b> and <b>{data.user.name}</b> (Resident) for the property located at <b>{data.property.address}</b>.</p>
          </section>

          <section>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-2">2. Financial Terms</h3>
            <p>The monthly rent is set at <b>₹{data.property.rentAmount.toLocaleString()}</b>. A security deposit of <b>₹{data.property.depositAmount.toLocaleString()}</b> is required for vault activation.</p>
          </section>

          <section>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-2">3. Maintenance & Repairs</h3>
            <p>A grace period of <b>{data.property.maintenanceRules.gracePeriodDays} days</b> is granted from move-in. Post this period, repairs under <b>₹{data.property.maintenanceRules.repairThreshold}</b> are the responsibility of the Resident.</p>
          </section>

          <section>
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-2">4. Exit & Notice</h3>
            <p>The lock-in period for this residency is <b>{data.property.exitPolicy.lockInMonths} months</b>. A minimum notice of <b>{data.property.exitPolicy.noticePeriodDays} days</b> is mandatory. Early exit results in forfeiture of the security deposit.</p>
          </section>
        </div>

        <div className="mt-20 border-t pt-10 font-sans">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Execution of Agreement</p>
           {signature ? (
             <div className="flex flex-col items-center">
               <img src={signature} alt="Signature" className="h-20 grayscale" />
               <p className="text-[10px] font-bold mt-2 border-t pt-2 w-48 text-center">{data.user.name}</p>
               <button onClick={() => setSignature(null)} className="text-[9px] text-red-400 font-bold uppercase mt-4">Redraw Signature</button>
             </div>
           ) : (
             <SignaturePad onSave={(img) => setSignature(img)} />
           )}
        </div>
      </div>

      {signature && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6">
          <button 
            onClick={handleFinalSign}
            disabled={isSubmitting}
            className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <>Seal Agreement & Pay <ArrowRight size={18}/></>}
          </button>
        </motion.div>
      )}
    </div>
  );
}