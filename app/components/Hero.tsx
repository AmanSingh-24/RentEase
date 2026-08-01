"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const AVATAR_SRCS = [
  "/prof-1.png",
  "/prof-2.png",
  "/prof-3.png",
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Background Image */}
      <Image
        src="/hero.png"
        alt="Modern rental home"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center brightness-110 contrast-105 saturate-125"
      />

      {/* Light overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5" />

      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-[110px] pb-16 text-center -translate-y-24 md:-translate-y-28">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md"
        >
          <div className="flex -space-x-2">
            {AVATAR_SRCS.map((src, i) => (
              <div
                key={i}
                className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <span className="text-sm font-semibold text-black">
            500+ Tenants Trust Us
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-7xl text-5xl font-extrabold leading-[1.02] tracking-tight text-black md:text-8xl"
        >
          Find Your Dream Home
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-black/80 md:text-xl"
        >
          Document your rental with timestamped photos. Track maintenance.
          Settle disputes with proof, not arguments.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-4xl bg-black px-6 py-3 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-95"
          >
            Explore Properties
            <ArrowRight size={18} />
          </Link>

          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-4xl border border-black/20 bg-white/85 px-6 py-3 text-base font-bold text-black backdrop-blur-md transition-all duration-300 hover:bg-white"
          >
            Book a Visit
          </Link>
        </motion.div>
      </div>

      {/* Navbar observer sentinel */}
      <div
        id="hero-sentinel"
        className="absolute inset-x-0 bottom-0 h-px w-full"
      />
    </section>
  );
}