"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import IntroScreen from "./components/IntroScreen";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import HowItWorks from "./components/HowItWorks";
import SocialProof from "./components/SocialProof";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function Home() {
  const router = useRouter();

  // Only admin gets hard-redirected away from the landing page.
  // Owners (with or without listings) and tenants always stay here —
  // they access their dashboards via the Navbar avatar → "My Dashboard".
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.user?.role === "admin") {
          router.replace("/admin/dashboard");
        }
      } catch { /* ignore — keep user on landing */ }
    };
    checkAndRedirect();
  }, [router]);

  return (
    <main className="relative min-h-screen bg-white">
      {/* 1. Intro splash screen */}
      <IntroScreen />

      {/* 2. Sticky Navbar */}
      <Navbar />

      {/* 3. Landing Page Sections */}
      <div className="flex flex-col w-full">

        <section id="hero" className="min-h-screen pt-20">
          <Hero />
        </section>

        <section id="problem" className="bg-[#F9FAFB] py-20">
          <Problem />
        </section>

        <section id="how-it-works" className="py-24 bg-[#F9FAFB]">
          <HowItWorks />
        </section>

        <section id="about" className="bg-[#F9FAFB] py-10">
          <SocialProof />
        </section>

        <section className="py-10 bg-[#F9FAFB]">
          <FinalCTA />
        </section>

        <footer className="bg-[#1F2937] py-12">
          <Footer />
        </footer>

      </div>
    </main>
  );
}