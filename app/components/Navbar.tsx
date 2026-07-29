"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ChevronDown, LayoutDashboard, Shield, Clock, Home, AlertCircle } from "lucide-react";
import NotificationBell from "./NotificationBell";
import FirstHostModal from "./FirstHostModal";

// ── Session type ──────────────────────────────────────────────────────────────
interface SessionUser {
  _id: string;
  name: string;
  role: string;
  hostStatus: "not_applied" | "pending" | "approved" | "rejected";
  firstHostLogin: boolean;
  rejectionReason: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [hostStatusPanel, setHostStatusPanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hostPanelRef = useRef<HTMLDivElement>(null);

  // ── Auth & session ────────────────────────────────────────────────────────
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showFirstHostModal, setShowFirstHostModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setSession(data.user);
            // Trigger congrats modal if first login after host approval
            if (data.user.firstHostLogin && data.user.hostStatus === "approved") {
              setShowFirstHostModal(true);
            }
          }
        }
      } catch { /* ignore */ }
      finally { setAuthLoading(false); }
    };
    checkSession();
  }, [pathname]);

  // Scroll + resize listeners
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => { if (window.innerWidth >= 768) setIsOpen(false); };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (hostPanelRef.current && !hostPanelRef.current.contains(e.target as Node)) setHostStatusPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setSession(null);
    setUserDropdown(false);
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const getDashboardLink = () => {
    if (session?.role === "admin") return "/admin/dashboard";
    if (session?.role === "owner") return "/dashboard-owner";
    if (session?.role === "tenant") return "/dashboard-tenant";
    return "/";
  };

  const handleRentYourHome = () => {
    if (!session) {
      router.push("/signup?redirect=/onboarding/landlord");
      return;
    }
    router.push("/onboarding/landlord");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Explore Properties", href: "/properties" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "About", href: "/#about" },
  ];

  const initials = session?.name
    ? session.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // ── Host Status Button ────────────────────────────────────────────────────
  // Renders different CTAs based on hostStatus
  const renderHostButton = () => {
    if (!session) {
      return (
        <button
          onClick={handleRentYourHome}
          className="hidden sm:block text-sm font-bold text-[#1F2937] px-4 py-2 hover:text-[#0052CC] transition-colors border border-gray-200 rounded-xl hover:border-[#0052CC]"
        >
          Rent Your Home
        </button>
      );
    }

    const { hostStatus } = session;

    if (hostStatus === "not_applied") {
      return (
        <button
          onClick={handleRentYourHome}
          className="hidden sm:block text-sm font-bold text-[#1F2937] px-4 py-2 hover:text-[#0052CC] transition-colors border border-gray-200 rounded-xl hover:border-[#0052CC]"
        >
          Rent Your Home
        </button>
      );
    }

    if (hostStatus === "pending") {
      return (
        <div className="relative hidden sm:block" ref={hostPanelRef}>
          <button
            onClick={() => setHostStatusPanel(!hostStatusPanel)}
            className="flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all"
          >
            <Clock size={14} className="animate-pulse" />
            Application (Pending)
            <ChevronDown size={13} className={`transition-transform ${hostStatusPanel ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {hostStatusPanel && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-amber-100 shadow-xl z-50 overflow-hidden"
              >
                <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
                  <p className="font-black text-sm text-amber-900">Application Status</p>
                </div>
                <div className="px-5 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-black text-[#1F2937] text-sm">🟡 Pending Review</p>
                      <p className="text-xs text-gray-400">Submitted & awaiting admin review</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Status</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Estimated review</span>
                      <span className="font-bold text-[#1F2937]">24–48 hours</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    We'll send you an in-app notification and email once your application has been reviewed.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (hostStatus === "approved") {
      return (
        <Link
          href="/dashboard-owner"
          className="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all"
        >
          <Home size={14} />
          Host Dashboard
        </Link>
      );
    }

    if (hostStatus === "rejected") {
      return (
        <div className="relative hidden sm:block" ref={hostPanelRef}>
          <button
            onClick={() => setHostStatusPanel(!hostStatusPanel)}
            className="flex items-center gap-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all"
          >
            <AlertCircle size={14} />
            Application Rejected
            <ChevronDown size={13} className={`transition-transform ${hostStatusPanel ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {hostStatusPanel && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-red-100 shadow-xl z-50 overflow-hidden"
              >
                <div className="bg-red-50 px-5 py-4 border-b border-red-100">
                  <p className="font-black text-sm text-red-900">Application Status</p>
                </div>
                <div className="px-5 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-black text-[#1F2937] text-sm">❌ Application Rejected</p>
                      <p className="text-xs text-gray-400">You can update & resubmit</p>
                    </div>
                  </div>
                  {session.rejectionReason && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-700 mb-1">Reason:</p>
                      <p className="text-xs text-red-600 leading-relaxed">{session.rejectionReason}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setHostStatusPanel(false); router.push("/onboarding/landlord"); }}
                    className="w-full py-3 bg-[#1F2937] text-white rounded-xl font-black text-sm hover:bg-black transition-colors"
                  >
                    Update & Resubmit Application
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return null;
  };

  // ── Mobile host status label ───────────────────────────────────────────────
  const getMobileHostLabel = () => {
    if (!session || session.hostStatus === "not_applied") return "Rent Your Home";
    if (session.hostStatus === "pending") return "Application (Pending)";
    if (session.hostStatus === "approved") return "Host Dashboard";
    if (session.hostStatus === "rejected") return "Application Rejected";
    return "Rent Your Home";
  };

  return (
    <>
      {/* First-host congratulations modal */}
      {showFirstHostModal && session && (
        <FirstHostModal
          userName={session.name}
          onDismiss={() => {
            setShowFirstHostModal(false);
            setSession((prev) => prev ? { ...prev, firstHostLogin: false } : prev);
          }}
        />
      )}

      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? "bg-white border-b border-gray-200 py-3 shadow-sm"
            : "bg-white py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
            <div className="hidden md:block relative w-[220px] h-[50px]">
              <Image src="/desk.png" alt="RentEase" fill className="object-contain object-left" priority />
            </div>
            <div className="block md:hidden relative w-[40px] h-[40px]">
              <Image src="/mob.png" alt="RentEase" fill className="object-contain" priority />
            </div>
          </Link>

          {/* CENTER LINKS — Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#1F2937] font-medium text-sm hover:text-[#0052CC] transition-colors relative group px-3"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0052CC] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <Link
              href="/properties"
              className="text-[#1F2937] font-medium text-sm hover:text-[#0052CC] transition-colors relative group px-3"
            >
              Explore Properties
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0052CC] transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            {/* Host status button — changes based on hostStatus */}
            {renderHostButton()}

            {authLoading ? (
              <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <NotificationBell userId={session._id} />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-100 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-black">
                      {initials}
                    </div>
                    <span className="text-sm font-bold text-[#1F2937] max-w-[80px] truncate hidden sm:block">
                      {session.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${userDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {userDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-sm font-black text-[#1F2937] truncate">{session.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {session.role === "admin" ? "Super Admin" :
                             session.role === "owner" && session.hostStatus === "approved" ? "Verified Host" :
                             session.role === "owner" ? "Property Owner" :
                             session.role === "tenant" ? "Tenant" : session.role}
                          </p>
                        </div>
                        {session.role !== "pending" && (
                          <Link
                            href={getDashboardLink()}
                            onClick={() => setUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-bold text-[#1F2937]"
                          >
                            {session.role === "admin"
                              ? <Shield size={16} className="text-purple-500" />
                              : <LayoutDashboard size={16} className="text-[#0052CC]" />}
                            {session.role === "admin" ? "Admin Panel" : "My Dashboard"}
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm font-bold text-red-500 border-t border-gray-50"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-bold text-[#1F2937] px-4 py-2 hover:text-[#0052CC] transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="hidden sm:block bg-[#0052CC] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-[#1E40AF] transition-all active:scale-95">
                  Get Started
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button className="md:hidden text-[#1F2937] p-1 outline-none" onClick={() => setIsOpen(!isOpen)}>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 space-y-4">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)}
                    className="text-lg font-semibold text-[#1F2937] hover:text-[#0052CC] transition-colors">
                    {link.name}
                  </Link>
                ))}
                <Link href="/properties" onClick={() => setIsOpen(false)}
                  className="text-lg font-semibold text-[#1F2937] hover:text-[#0052CC] transition-colors">
                  Explore Properties
                </Link>
                <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (session?.hostStatus === "approved") router.push("/dashboard-owner");
                      else handleRentYourHome();
                    }}
                    className={`w-full py-3 font-bold border rounded-xl transition-colors text-sm ${
                      session?.hostStatus === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : session?.hostStatus === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : session?.hostStatus === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "text-[#1F2937] border-gray-200"
                    }`}
                  >
                    {getMobileHostLabel()}
                  </button>
                  {session ? (
                    <>
                      <Link href={getDashboardLink()} onClick={() => setIsOpen(false)}
                        className="w-full py-3 text-center bg-gray-50 text-[#1F2937] font-bold rounded-xl border border-gray-200 text-sm">
                        My Dashboard
                      </Link>
                      <button onClick={() => { setIsOpen(false); handleLogout(); }}
                        className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-xl border border-red-100 text-sm">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}
                        className="w-full py-3 text-center text-[#1F2937] font-bold border border-gray-200 rounded-xl text-sm">
                        Login
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}
                        className="w-full py-4 text-center bg-[#0052CC] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm">
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}