"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

export interface HighlightsProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Looping words shown in the infinite marquee behind the card */
  marqueeItems?: string[];
  videoSrc: string;
  posterSrc?: string;
  /**
   * How much scroll distance (in viewport heights) the pinned stage takes.
   * Bigger = slower / more scroll needed to grow the card and reach the hold.
   */
  scrollHeightVh?: number;
  /** Progress (0-1) at which the card finishes growing to fullscreen. The
   * remaining progress is a "hold" where the fullscreen card just sits still
   * before the section releases into normal scroll. */
  growEnd?: number;
  className?: string;
}

export default function Highlights({
  eyebrow = "Highlighted Home",
  heading = "Modern homes,\ndesigned to live better",
  description = "Explore how modern homes are designed to feel clean, open, and functional.",
  marqueeItems = ["Explore Homes", "Live Better", "Modern Homes"],
  videoSrc,
  posterSrc,
  scrollHeightVh = 300,
  growEnd = 0.75,
  className = "",
}: HighlightsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className={`w-full bg-white ${className}`}>
      {/* Static header — plain page content, no scroll wiring at all, so it
          never fades and scrolls away completely normally. */}
      <div className="px-8 pb-24 pt-16 md:px-16 md:pt-20 lg:px-28 lg:pt-24">
        <HighlightsHeader eyebrow={eyebrow} heading={heading} description={description} />
      </div>

      {prefersReducedMotion ? (
        <div className="relative mx-auto mb-24 h-[60vh] w-full max-w-3xl overflow-hidden rounded-[32px]">
          <video
            src={videoSrc}
            poster={posterSrc}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        </div>
      ) : (
        <PinnedStage
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          marqueeItems={marqueeItems}
          scrollHeightVh={scrollHeightVh}
          growEnd={growEnd}
        />
      )}
    </section>
  );
}

function PinnedStage({
  videoSrc,
  posterSrc,
  marqueeItems,
  scrollHeightVh,
  growEnd,
}: {
  videoSrc: string;
  posterSrc?: string;
  marqueeItems: string[];
  scrollHeightVh: number;
  growEnd: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Holds the scale factors needed for the card to exactly cover the
  // viewport. Measured from the card's *unscaled* layout size, so it stays
  // correct across breakpoints/resizes without hardcoding vw/vh math.
  const targetScale = useRef({ x: 1, y: 1 });

  // Only this pinned stage is wired to scroll — the heading above it is
  // completely untouched by any of this.
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const measure = () => {
      const el = cardRef.current;
      if (!el) return;
      // offsetWidth/Height reflect the layout box and ignore CSS transforms,
      // so this stays accurate even while the card is mid-scale.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w && h) {
        targetScale.current = {
          x: window.innerWidth / w,
          y: window.innerHeight / h,
        };
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Card grows from its natural size (scale 1) up to fullscreen coverage,
  // then holds at fullscreen for the remaining scroll distance.
  const scaleX = useTransform(scrollYProgress, (p) => {
    const t = Math.min(p / growEnd, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    return 1 + eased * (targetScale.current.x - 1);
  });
  const scaleY = useTransform(scrollYProgress, (p) => {
    const t = Math.min(p / growEnd, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    return 1 + eased * (targetScale.current.y - 1);
  });
  const radius = useTransform(scrollYProgress, [0, growEnd], [32, 0]);

  // Marquee fades as the card grows large enough to cover it.
  const marqueeOpacity = useTransform(scrollYProgress, [0.1, 0.45], [1, 0]);

  // Play the video once the stage is actually in scroll range.
  const videoElRef = useRef<HTMLVideoElement>(null);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const video = videoElRef.current;
    if (!video) return;
    if (p > 0 && p < 1 && video.paused) {
      video.play().catch(() => {});
    }
  });

  const marqueeLoop = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height: `${scrollHeightVh}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* Infinite marquee, vertically centered behind the card */}
        <motion.div
          style={{ opacity: marqueeOpacity }}
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 overflow-hidden"
        >
          <div className="animate-highlights-marquee flex w-max items-center gap-6 whitespace-nowrap">
            {marqueeLoop.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-6 text-6xl font-extrabold tracking-tight text-black md:text-7xl lg:text-8xl"
              >
                {item}
                <span className="h-2 w-2 rounded-full bg-black" />
              </span>
            ))}
          </div>
        </motion.div>

        {/* Growing video card */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <motion.div
            ref={cardRef}
            style={{ scaleX, scaleY, borderRadius: radius }}
            className="relative h-[46vh] w-[88vw] max-w-[560px] overflow-hidden shadow-2xl md:h-[58vh] md:w-[40vw]"
          >
            <video
              ref={videoElRef}
              src={videoSrc}
              poster={posterSrc}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function HighlightsHeader({
  eyebrow,
  heading,
  description,
}: {
  eyebrow: string;
  heading: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
          </span>
          {eyebrow.toUpperCase()}
        </div>
        <h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-black md:text-5xl">
          {heading.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>
      </div>
      <p className="max-w-xs text-black lg:text-right">{description}</p>
    </div>
  );
}