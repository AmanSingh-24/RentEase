"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2, UserCircle2, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const router = useRouter();

  const handleRoleSelect = async (selectedRole: "owner" | "tenant") => {
    try {
      // ✅ FIX: No more localStorage email lookups. We only send the role string.
      const res = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (res.ok) {
        // Redirect directly to the matching secure dashboard matrix path
        router.push(selectedRole === "owner" ? "/dashboard-owner" : "/dashboard-tenant");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update security role profile.");
      }
    } catch (err) {
      alert("Failed to set role. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
           <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#0052CC" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-4xl font-bold text-[#1F2937] mb-4">Welcome to RentEase</h1>
        <p className="text-gray-500 text-lg">Tell us how you'll be using the platform.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        
        {/* OWNER CARD */}
        <motion.div
          whileHover={{ y: -10 }}
          onClick={() => handleRoleSelect("owner")}
          className="bg-white border-2 border-gray-100 p-10 rounded-[40px] shadow-sm hover:border-[#0052CC] cursor-pointer transition-all group"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0052CC] mb-8 group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937] mb-3">I am a Landlord</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Manage your properties, verify inspections, and track rent payments in one secure vault.
          </p>
          <div className="flex items-center gap-2 text-[#0052CC] font-bold">
            Get Started <ArrowRight size={18} />
          </div>
        </motion.div>

        {/* TENANT CARD */}
        <motion.div
          whileHover={{ y: -10 }}
          onClick={() => handleRoleSelect("tenant")}
          className="bg-white border-2 border-gray-100 p-10 rounded-[40px] shadow-sm hover:border-[#0D9488] cursor-pointer transition-all group"
        >
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-[#0D9488] mb-8 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
            <UserCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937] mb-3">I am a Tenant</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Document your move-in, report issues, and protect your deposit with Digital Witness.
          </p>
          <div className="flex items-center gap-2 text-[#0D9488] font-bold">
            Get Started <ArrowRight size={18} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}