"use client";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Everyone lands on / after login.
  // The landing page's useEffect auto-redirects:
  //   - Admin        → /admin/dashboard
  //   - Owner with listings → /dashboard-owner
  //   - Everyone else → stays on landing page
  // The only exception: if ?redirect= is set (e.g. from "Apply for property" or "Rent Your Home")
  const getDestination = (user: any): string => {
    if (redirectTo) return redirectTo;
    // Admin is the only one we fast-track because they should never see the landing page
    if (user.role === "admin") return "/admin/dashboard";
    return "/";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        const dest = getDestination(data.user);
        router.push(dest);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
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
        const dest = getDestination(data.user);
        router.push(dest);
      } else {
        setError(data.error || "Google authentication failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Google Sign-In failed. Please try again.");
    }
  };

  
  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2 overflow-hidden relative">
      <div className="hidden lg:block relative">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 100 0 C 70 0, 80 20, 80 50 C 80 80, 70 100, 100 100 L 100 0 Z" fill="white" />
          <path d="M 100 0 C 70 0, 80 20, 80 50 C 80 80, 70 100, 100 100 L 0 100 L 0 0 Z" fill="#0D9488" />
        </svg>

        <div className="relative z-10 flex items-center justify-center w-full h-full p-12">
          <div className="absolute bottom-0 left-0 w-[90%] h-[70%]">
            <Image src="/login.png" alt="RentEase Login Visual" fill className="object-contain object-left-bottom drop-shadow-2xl" priority />
          </div>
          <div className="relative w-full h-full">
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] right-[20%] bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl max-w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">🔐</div>
                <span className="font-bold text-white text-sm">Secure Access</span>
              </div>
              <p className="text-[10px] text-white/70 leading-relaxed">Your encrypted rental vault is protected with proof-based authentication.</p>
            </motion.div>
            <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[1%] left-[25%] bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 max-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
                <span className="font-bold text-[#1F2937] text-sm">System Ready</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2, delay: 0.5 }} className="h-full bg-[#0D9488]" />
              </div>
            </motion.div>
          </div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        </div>
      </div>

      <div className="flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 relative z-30 bg-white">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/">
            <div className="relative w-[180px] h-[50px]">
              <Image src="/desk.png" alt="RentEase Logo" fill className="object-contain object-left" priority />
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] tracking-tight mb-4">Login</h1>
          <p className="text-gray-500 text-lg mb-10">Access your RentEase vault with proof-based security.</p>
        </motion.div>

        <form className="space-y-6 max-w-md" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="aman@example.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/5 outline-none transition-all text-[#1F2937]" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Password</label>
              <Link href="#" className="text-[10px] font-bold text-[#0D9488] uppercase hover:underline">Forgot Password?</Link>
            </div>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/5 outline-none transition-all text-[#1F2937]" 
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <span className="text-red-500 text-lg">⚠</span>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-[#0D9488] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="max-w-md mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-100 w-full"></div>
            <span className="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest absolute">Or</span>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full bg-white border border-gray-100 text-[#1F2937] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <FcGoogle size={24} />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-10 text-gray-500">
          Not a member yet? <Link href="/signup" className="text-[#0D9488] font-bold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}