"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Impact from "./components/Impact";
import Active from "./components/Active";
import Services from "./components/Services";
import Listings from "./components/Listings";
import Highlights from "./components/Highlights";
import Faq from "./components/Faq";
import Reviews from "./components/Reviews";
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

      {/* 2. Sticky Navbar */}
      <Navbar />

      {/* 3. Landing Page Sections */}
      <div className="flex flex-col w-full">

        <section id="hero" className="relative">
          <Hero />
        </section>

<section
    id="impact"
    className="relative bg-white pt-20 pb-20"
>
    <Impact />
</section>


        <section id="active" className="py-20 bg-[#F9FAFB]">
          <Active />
        </section>

        <section id="services" className="bg-[#F9FAFB] py-20">
          <Services />
        </section>

        <section id="listings" className="py-20 bg-[#F9FAFB]">
          <Listings />
        </section>

        <section id="highlights" className="bg-[#F9FAFB] py-20">
          <Highlights videoSrc="/video.mp4" posterSrc="/poster.png" />
        </section>
         
         <section id="faq" className="py-20 bg-[#F9FAFB]">
          <Faq />
        </section>

        <section id="about" className="bg-[#F9FAFB] py-10">
          <Reviews />
        </section>

         <Footer bgImageSrc="/footer.png" />

      </div>
    </main>
  );
}