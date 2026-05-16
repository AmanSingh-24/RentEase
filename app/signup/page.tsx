"use client";

import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) router.push("/login");
      else alert(data.error);
    } catch (err) {
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          uid: result.user.uid,
        }),
      });

      const data = await res.json(); 

      if (res.ok && data.user) {
        if (data.user.role === "pending") {
          router.push("/role-selection");
        } else if (data.user.role === "owner") {
          router.push("/dashboard-owner");
        } else if (data.user.role === "tenant") {
          if (data.user.isOnboarded === false) {
            router.push("/onboarding/payment");
          } else {
            router.push("/dashboard-tenant");
          }
        }
      } else {
        alert(data.error || "Google sync failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Google Sign-In failed.");
    }
  };

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2 overflow-hidden relative">
      <div className="flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 relative z-30 bg-white">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/">
            <div className="relative w-[180px] h-[50px]">
              <Image src="/desk.png" alt="RentEase Logo" fill className="object-contain object-left" priority />
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] tracking-tight mb-4">Sign Up</h1>
          <p className="text-gray-500 text-lg mb-10">Secure your rental agreements with RentEase.</p>
        </motion.div>

        <form className="space-y-6 max-w-md" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</label>
            <input 
              required
              type="text" 
              placeholder="Aman Kumar Singh"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 outline-none transition-all text-[#1F2937]" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="aman@example.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 outline-none transition-all text-[#1F2937]" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 outline-none transition-all text-[#1F2937]" 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#0052CC] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="max-w-md mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-100 w-full"></div>
            <span className="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest absolute">Or</span>
          </div>

          <button 
            onClick={handleGoogleSignUp}
            className="w-full bg-white border border-gray-100 text-[#1F2937] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <FcGoogle size={24} />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-10 text-gray-500">
          Already a member? <Link href="/login" className="text-[#0052CC] font-bold hover:underline">Sign In</Link>
        </p>
      </div>

      <div className="hidden lg:block relative">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 0 C 30 0, 20 20, 20 50 C 20 80, 30 100, 0 100 L 0 0 Z" fill="white" />
          <path d="M 0 0 C 30 0, 20 20, 20 50 C 20 80, 30 100, 0 100 L 100 100 L 100 0 Z" fill="#0052CC" />
        </svg>

        <div className="relative z-10 flex items-center justify-center w-full h-full p-12">
          <div className="absolute bottom-0 right-0 w-[90%] h-[70%]">
            <Image src="/signup.png" alt="Join RentEase" fill className="object-contain object-right-bottom drop-shadow-2xl" priority />
          </div>

          <div className="relative w-full h-full">
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] left-[20%] bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl max-w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">🔒</div>
                <span className="font-bold text-white text-sm">Encrypted Evidence</span>
              </div>
              <p className="text-[10px] text-white/70 leading-relaxed">Every photo is cryptographically verified to ensure zero tampering.</p>
            </motion.div>

            <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[1%] right-[25%] bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 max-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
                <span className="font-bold text-[#1F2937] text-sm">Verified State</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2, delay: 0.5 }} className="h-full bg-[#0D9488]" />
              </div>
            </motion.div>

            <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] right-[0%] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">✅</div>
                <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Status</p>
                  <p className="text-xs font-bold text-white">Digital Witness Active</p>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        </div>
      </div>
    </div>
  );
}