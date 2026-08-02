"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, MotionValue } from "framer-motion";

/**
 * Hardcoded into 4 lines (matching the reference exactly) rather than left
 * to wrap naturally. `emphasis: true` words render bold + italic
 * ("discovery," and "buyers"), everything else renders at normal weight.
 */
const LINES: { text: string; emphasis?: boolean }[][] = [
  [
    { text: "Focused" },
    { text: "on" },
    { text: "discovery,", emphasis: true },
    { text: "built" },
    { text: "for" },
    { text: "real" },
    { text: "choices." },
  ],
  [
    { text: "We" },
    { text: "design" },
    { text: "platforms" },
    { text: "that" },
    { text: "help" },
    { text: "buyers", emphasis: true },
  ],
  [
    { text: "explore" },
    { text: "homes," },
    { text: "understand" },
    { text: "value," },
    { text: "and" },
  ],
  [{ text: "move" }, { text: "forward" }, { text: "with" }, { text: "confidence." }],
];

const TOTAL_WORDS = LINES.reduce((sum, line) => sum + line.length, 0);

// How many px of wheel/touch delta it takes to go from 0 -> 1 reveal.
// Bigger = slower, more deliberate reveal.
const DISTANCE = 1400;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function Word({
  children,
  progress,
  range,
  emphasis,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  emphasis?: boolean;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  // Drop the compositing hint once a word is fully revealed so it doesn't
  // keep rendering through a (blurry) GPU layer after it's done animating.
  const willChange = useTransform(opacity, (v) => (v >= 1 ? "auto" : "opacity"));

  return (
    <span
      className={`relative mr-[0.28em] inline-block ${
        emphasis ? "font-bold italic" : "font-normal"
      }`}
    >
      <motion.span style={{ opacity, willChange }}>{children}</motion.span>
    </span>
  );
}

export default function Active() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useMotionValue(0); // 0 -> 1, drives every word's opacity

  // 'before'  = section hasn't been reached yet, page scrolls normally
  // 'locked'  = section is pinned, we're consuming scroll input ourselves
  // 'after'   = reveal finished, page scrolls normally again
  const phase = useRef<"before" | "locked" | "after">("before");
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const lock = () => {
      phase.current = "locked";
      document.body.style.overflow = "hidden";
    };

    const unlock = (next: "before" | "after") => {
      phase.current = next;
      document.body.style.overflow = "";
    };

    // Watches normal page scroll to know when the section has arrived at
    // the top of the viewport (going down) or come back into view (going
    // up), and pins it at exactly that moment.
    const onScroll = () => {
      if (!sectionRef.current || phase.current === "locked") return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollingDown = window.scrollY > lastScrollY.current;
      lastScrollY.current = window.scrollY;

      if (phase.current === "before" && scrollingDown && rect.top <= 0) {
        // Snap so the section sits perfectly flush with the top of the
        // viewport before taking over, then lock.
        window.scrollBy({ top: rect.top, left: 0, behavior: "instant" as ScrollBehavior });
        lock();
      } else if (phase.current === "after" && !scrollingDown && rect.top >= 0) {
        window.scrollBy({ top: rect.top, left: 0, behavior: "instant" as ScrollBehavior });
        lock();
      }
    };

    const consume = (deltaY: number, e: Event) => {
      if (phase.current !== "locked") return;

      const current = progress.get();

      // Already fully revealed and still scrolling down -> let go, this
      // wheel/touch tick is allowed through to scroll the real page.
      if (current >= 1 && deltaY > 0) {
        unlock("after");
        return;
      }
      // Back at the start and still scrolling up -> release upward too.
      if (current <= 0 && deltaY < 0) {
        unlock("before");
        return;
      }

      e.preventDefault();
      progress.set(clamp(current + deltaY / DISTANCE, 0, 1));
    };

    const onWheel = (e: WheelEvent) => consume(e.deltaY, e);

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const deltaY = touchY - y; // swipe up == positive == scrolling down
      touchY = y;
      consume(deltaY, e);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.body.style.overflow = "";
    };
  }, [progress]);

  let wordIndex = 0;

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-[#F9FAFB]">
      <div
        className="flex h-full flex-col items-center justify-center px-6 antialiased"
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      >
        <div className="mx-auto max-w-5xl text-center text-4xl leading-[1.25] tracking-tight text-neutral-950 sm:text-5xl sm:leading-[1.25] lg:text-6xl lg:leading-[1.25]">
          {LINES.map((line, li) => (
            <div key={li} className="whitespace-nowrap">
              {line.map((word, wi) => {
                const i = wordIndex++;
                const start = i / TOTAL_WORDS;
                const end = (i + 1) / TOTAL_WORDS;
                return (
                  <Word key={wi} progress={progress} range={[start, end]} emphasis={word.emphasis}>
                    {word.text}
                  </Word>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}