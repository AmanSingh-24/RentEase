"use client";

import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getDestination = (user: any): string => {
    if (redirectTo) return redirectTo;
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
      {/* Left Column: Image with curvy clip separation */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block relative w-full h-full min-h-screen"
      >
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id="loginCurve" clipPathUnits="objectBoundingBox">
              <path d="M0.8,0 C0.92,0 0.8,0.2 0.8,0.5 C0.8,0.8 0.92,1 0.8,1 L0,1 L0,0 Z" />
            </clipPath>
          </defs>
        </svg>

        <div
          className="absolute inset-0"
          style={{ clipPath: "url(#loginCurve)" }}
        >
          <Image
            src="/login.png"
            alt="RentEase Login Visual"
            fill
            className="object-cover"
            priority
          />
        </div>
      </motion.div>

      {/* Right Column: Form Container */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-20 xl:px-28 py-12 relative z-30 bg-white"
      >
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <div className="relative w-44 h-12">
                <Image
                  src="/desk3.png"
                  alt="RentEase Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Welcome back to RentEase! <br />
              Please login to continue
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Welcome back to our real estate application. Please enter your login credentials to access your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                Email
              </label>
              <input
                required
                type="email"
                placeholder="anil@google.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                />
                Remember me
              </label>
              <Link href="#" className="font-semibold text-neutral-800 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            {/* Submit Button (Black theme) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold text-sm transition-colors shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-neutral-400 font-medium">
              Or Login With
            </span>
          </div>

          {/* Google Sign-in with text */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full py-3.5 border border-neutral-300 rounded-xl font-bold text-sm text-neutral-800 flex items-center justify-center gap-3 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <FcGoogle size={20} />
            <span>Continue With Google</span>
          </button>

          {/* Bottom Switch Link */}
          <p className="text-center text-xs text-neutral-500 mt-8">
            If you don't have an account?{" "}
            <Link
              href={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="font-bold text-black hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}