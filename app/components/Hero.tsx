"use client";

import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Default icons

// DYNAMIC COUNTER COMPONENT
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => setDisplayValue(Math.floor(latest)));
  }, [springValue]);

  return <span ref={ref} className="tabular-nums">{displayValue}{suffix}</span>;
}

export default function Hero() {
  const [activeCard, setActiveCard] = useState(0);

  // MOCKUP DATA FOR 3 CARDS
  const cards = [
    {
      title: "Move-Out Inspection",
      location: "123 MG Road, Bangalore",
      leftImg: "/before1.jpg",
      rightImg: "/after1.png",
      leftLabel: "Move-In (Feb 2024)",
      rightLabel: "Move-Out (Feb 2026)",
      verdict: "No new damage detected. Full refund processed."
    },
    {
      title: "Maintenance Tracker",
      location: "Gandhinagar, Gujarat",
      leftImg: "/before2.jpg", 
      rightImg: "/after2.png",
      leftLabel: "Reported: Leaking Tap",
      rightLabel: "Resolved: Plumber Assigned",
      verdict: "Issue resolved in 4 hours. Documentation locked."
    },
    {
      title: "Damage Dispute",
      location: "bhopal, Madhya Pradesh",
      leftImg: "/before3.jpg",
      rightImg: "/after3.png",
      leftLabel: "Initial Inspection",
      rightLabel: "Damage Dispute",
      verdict: "Damage detected and documented."
    }
  ];

  const nextCard = () => setActiveCard((prev) => (prev + 1) % cards.length);
  const prevCard = () => setActiveCard((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <div id="home" className="relative pt-32 pb-40 overflow-hidden" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-30 blur-[120px] rounded-full" 
             style={{ backgroundColor: 'rgba(0, 82, 204, 0.08)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* TEXT CONTENT */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: '#1F2937' }}>
            Never fight over <br /> <span style={{ color: '#0052CC' }}>security deposits</span> again
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
            Document your rental with timestamped photos. Track maintenance. Settle disputes with proof, not arguments.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/properties" className="text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform w-full sm:w-auto text-center"
              style={{ backgroundColor: '#0052CC', boxShadow: '0 20px 60px -15px rgba(0, 82, 204, 0.3)' }}>
              Explore Properties 🔍
            </a>
            <a href="#how-it-works" className="font-semibold px-8 py-4 bg-white hover:bg-gray-200 rounded-xl transition-colors w-full sm:w-auto text-center"
              style={{ color: '#1F2937' }}>
              See How It Works →
            </a>
          </motion.div>
        </div>

        {/* --- DYNAMIC STATS SECTION --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border border-gray-200 rounded-3xl shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
          <div className="p-6">
            <h4 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-1"><Counter value={500} suffix="+" /></h4>
            <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest">Tenants Served</p>
          </div>
          <div className="p-6 border-y md:border-y-0 md:border-x border-gray-200">
            <h4 className="text-3xl md:text-4xl font-bold text-[#0052CC] mb-1"><Counter value={1200} suffix="+" /></h4>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inspections Locked</p>
          </div>
          <div className="p-6">
            <h4 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-1"><Counter value={98} suffix="%" /></h4>
            <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest">Disputes Settled</p>
          </div>
        </motion.div>

        {/* --- 3D MOCKUP SLIDER --- */}
        <div className="relative group" style={{ perspective: '2000px' }}>
          
          {/* NAVIGATION ARROWS */}
          <button onClick={prevCard} className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0052CC] transition-all hover:scale-110 active:scale-90">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextCard} className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0052CC] transition-all hover:scale-110 active:scale-90">
            <ChevronRight size={24} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCard}
              initial={{ opacity: 0, rotateX: 25, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, rotateX: 15, rotateY: -5, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: 10, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-[1000px] rounded-3xl p-6 md:p-8 overflow-hidden bg-white border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="space-y-6">
                {/* Mockup Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0052CC]/10 text-[#0052CC]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2937]">{cards[activeCard].title}</h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{cards[activeCard].location}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                    Cryptographically Locked
                  </div>
                </div>

                {/* Side by Side Display */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cards[activeCard].leftLabel}</p>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                      <Image src={cards[activeCard].leftImg} alt="Before" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[#0052CC] uppercase tracking-widest">{cards[activeCard].rightLabel}</p>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                      <Image src={cards[activeCard].rightImg} alt="After" fill className="object-cover" />
                    </div>
                  </div>
                </div>

                {/* Status Verdict */}
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0D9488]/5 border border-[#0D9488]/10">
                  <div className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                  <p className="text-sm font-bold text-[#0D9488]">{cards[activeCard].verdict}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}