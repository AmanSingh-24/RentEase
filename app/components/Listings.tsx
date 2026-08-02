"use client";

import Image from "next/image";
import { ArrowRight, Bath, BedDouble, Home, Maximize2 } from "lucide-react";

export interface Listing {
  /** Unique key */
  id: string;
  /** Card photo */
  image: string;
  /** Pill label shown top-right, e.g. "For Rent" / "For Buy" */
  badge: string;
  title: string;
  /** Pre-formatted price, e.g. "$9,200" */
  price: string;
  beds: string | number;
  baths: string | number;
  /** Pre-formatted area, e.g. "2,400 sq ft" */
  sqft: string;
}

export interface ListingsProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  listings?: Listing[];
  className?: string;
}

const DEFAULT_LISTINGS: Listing[] = [
  {
    id: "hillside-view",
    image: "/listing-1.jpeg",
    badge: "For Rent",
    title: "Hillside View House",
    price: "$9,200",
    beds: "4+",
    baths: 3,
    sqft: "2,400 sq ft",
  },
  {
    id: "modern-hillside",
    image: "/listing-2.jpeg",
    badge: "For Rent",
    title: "Modern Hillside Home",
    price: "$58,000",
    beds: 3,
    baths: 2,
    sqft: "3,100 sq ft",
  },
  {
    id: "dallas-townhouse",
    image: "/listing-3.png",
    badge: "For Rent",
    title: "Dallas Townhouse",
    price: "$9,800",
    beds: 3,
    baths: 2,
    sqft: "980 sq ft",
  },
  {
    id: "urban-modern",
    image: "/listing-4.png",
    badge: "For Rent",
    title: "Urban Modern House",
    price: "$34,000",
    beds: "4+",
    baths: 3,
    sqft: "4,200 sq ft",
  },
];

export default function Listings({
  eyebrow = "Property Listings",
  heading = "Discover homes\nthat fit your lifestyle",
  description = "Explore a range of properties built for comfort, location, and everyday living.",
  ctaLabel = "Explore All",
  onCtaClick,
  listings = DEFAULT_LISTINGS,
  className = "",
}: ListingsProps) {
  return (
    <section className={`w-full bg-[#F9FAFB] px-8 py-16 md:px-16 md:py-20 lg:px-40 lg:py-24 ${className}`}>
      {/* Header — same styling as Services for visual consistency */}
      <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </span>
            {eyebrow.toUpperCase()}
          </div>
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950 md:text-5xl">
            {heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <p className="max-w-xs text-neutral-500 lg:text-right">{description}</p>
          <button
            type="button"
            onClick={onCtaClick}
            className="inline-flex items-center gap-4 rounded-full bg-neutral-950 py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {ctaLabel}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-950">
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="group relative h-[420px] w-full overflow-hidden rounded-[28px] md:h-[460px]"
          >
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badge */}
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white">
                <Home size={12} strokeWidth={2.5} />
              </span>
              <span className="text-sm font-medium text-neutral-900">{listing.badge}</span>
            </div>

            {/* Bottom gradient + content */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 pt-20 text-white">
              <p className="text-base font-medium">{listing.title}</p>
              <p className="text-2xl font-extrabold md:text-3xl">{listing.price}</p>

              <div className="mt-1 flex items-center gap-3 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <BedDouble size={16} />
                  {listing.beds}
                </span>
                <span className="h-4 w-px bg-white/30" />
                <span className="flex items-center gap-1.5">
                  <Bath size={16} />
                  {listing.baths}
                </span>
                <span className="h-4 w-px bg-white/30" />
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={16} />
                  {listing.sqft}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}