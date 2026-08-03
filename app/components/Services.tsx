"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

export interface ServiceItem {
  /** Unique key for the card */
  id: string;
  /** Shown as the big numeral, e.g. ".01" */
  index: string;
  /** Small label above the title, e.g. "Buy a Home" */
  eyebrow: string;
  /** Card headline */
  title: string;
  /** Image shown only while this card is expanded */
  image: string;
}

export interface ServicesProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  items?: ServiceItem[];
  /** Index of the card expanded on first render */
  defaultActiveIndex?: number;
  className?: string;
}

const DEFAULT_ITEMS: ServiceItem[] = [
  {
    id: "find",
    index: ".01",
    eyebrow: "Find Your Home",
    title: "Browse Verified Rentals Across Your City",
    image: "/services-1.png",
  },
  {
    id: "move",
    index: ".02",
    eyebrow: "Move In Digitally",
    title: "Sign Agreements, Pay & Complete Inspection",
    image: "/services-2.png",
  },
  {
    id: "manage",
    index: ".03",
    eyebrow: "Manage Everything",
    title: "Track Payments, Requests & Your Entire Tenancy",
    image: "/services-3.png",
  },
];

export default function Services({
eyebrow = "Our Services",
heading = "Everything you\nneed to rent smarter",
description = "From finding verified homes to managing payments, inspections, maintenance, and communication—all in one platform.",
  items = DEFAULT_ITEMS,
  defaultActiveIndex = 0,
  className = "",
}: ServicesProps) {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveIndex(i);
    }
  };

  return (
    <section className={`w-full bg-white px-6 py-16 md:px-10 md:py-20 lg:px-40 lg:py-24 ${className}`}>
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </span>
            {eyebrow}
          </div>
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 md:text-5xl">
            {heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        <p className="max-w-xs text-neutral-500 lg:text-right">{description}</p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 md:gap-5 lg:h-[600px] lg:flex-row">
        {items.map((item, i) => {
          const isActive = i === activeIndex;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={`${item.eyebrow}: ${item.title}`}
              onClick={() => setActiveIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={[
                "relative cursor-pointer overflow-hidden rounded-[28px] outline-none transition-all duration-500 ease-in-out",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900",
                isActive
                  ? "h-[460px] flex-[2.4] bg-neutral-950 lg:h-full"
                  : "h-[128px] flex-[1] bg-neutral-100 lg:h-full",
              ].join(" ")}
            >
              {/* Collapsed content */}
              <div
                className={[
                  "absolute inset-0 flex flex-col p-6 transition-opacity duration-300 md:p-8",
                  isActive ? "pointer-events-none opacity-0" : "opacity-100 delay-150",
                ].join(" ")}
              >
                <div className="flex flex-1 items-center justify-center">
                  <span className="select-none text-[64px] font-extrabold leading-none text-neutral-300 md:text-[84px] lg:text-[96px]">
                    {item.index}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">{item.eyebrow}</p>
                  <h3 className="mt-1 text-xl font-extrabold leading-snug text-neutral-950 md:text-xl">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Expanded content */}
              <div
                className={[
                  "absolute inset-0 flex flex-col p-6 text-white transition-opacity duration-300 md:p-8",
                  isActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-300">{item.eyebrow}</p>
                    <h3 className="mt-2 max-w-xs text-2xl font-extrabold leading-tight md:text-3xl">
                      {item.title}
                    </h3>
                  </div>
                  <span className="select-none text-[64px] font-extrabold leading-none text-white md:text-[84px] lg:text-[96px]">
                    {item.index}
                  </span>
                </div>

                <div className="relative -mx-6 -mb-6 mt-4 flex-1 overflow-hidden md:-mx-8 md:-mb-8 md:mt-6">
                  {/* Scaling the photo down and anchoring it to the bottom reveals the
                      card's own black background around it, instead of the photo's own
                      backdrop — this is what removes the hard seam and the "zoomed in" look.
                      Tune the scale value (e.g. 0.8–0.95) to taste. */}
                  <div className="absolute inset-0 origin-bottom scale-[0.85] transition-transform duration-500">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-fit object-bottom"
                      priority={isActive}
                    />
                  </div>
                  {/* Soft fade so the top edge of the photo melts into black */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-950 to-transparent md:h-24" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}