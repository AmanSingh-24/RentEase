"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, MapPin, Home, X, PawPrint, Layers,
  ArrowRight, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import FAQ from "../components/Faq";
import Footer from "../components/Footer";

// ── Label maps ───────────────────────────────────────────────────────────────
const FURNISHING_LABELS: Record<string, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-Furnished",
  fully_furnished: "Fully Furnished",
};
const FURNISHING_COLORS: Record<string, string> = {
  unfurnished: "bg-gray-100 text-gray-600",
  semi_furnished: "bg-blue-50 text-blue-600",
  fully_furnished: "bg-teal-50 text-teal-700",
};

// Price range presets
const PRICE_RANGES = [
  { label: "Any",          min: "",      max: "" },
  { label: "Under ₹10k",  min: "",      max: "10000" },
  { label: "₹10k–₹25k",  min: "10000", max: "25000" },
  { label: "₹25k–₹50k",  min: "25000", max: "50000" },
  { label: "₹50k+",       min: "50000", max: "" },
];

type Filters = {
  search: string;
  state: string;
  city: string;
  bhk: string;
  minRent: string;
  maxRent: string;
  furnishing: string;
  petsAllowed: string;
};

const EMPTY_FILTERS: Filters = {
  search: "", state: "", city: "", bhk: "",
  minRent: "", maxRent: "", furnishing: "", petsAllowed: "",
};

// ── Pill chip ────────────────────────────────────────────────────────────────
function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

// ── Eyebrow label ─────────────────────────────────────────────────────────────
function Eyebrow({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
      </span>
      {label.toUpperCase()}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activePriceRange, setActivePriceRange] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const f = (key: keyof Filters, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === val ? "" : val }));

  const fetchListings = useCallback(async (active: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (active.search)      params.set("search", active.search);
      if (active.state)       params.set("state", active.state);
      if (active.city)        params.set("city", active.city);
      if (active.bhk)         params.set("bhk", active.bhk);
      if (active.minRent)     params.set("minRent", active.minRent);
      if (active.maxRent)     params.set("maxRent", active.maxRent);
      if (active.furnishing)  params.set("furnishing", active.furnishing);
      if (active.petsAllowed) params.set("petsAllowed", active.petsAllowed);
      const res = await fetch(`/api/properties/marketplace?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setProperties(data.properties || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchListings(EMPTY_FILTERS); }, [fetchListings]);

  // Debounced re-fetch on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchListings(filters), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, fetchListings]);

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActivePriceRange(0);
  };

  const setPriceRange = (idx: number) => {
    setActivePriceRange(idx);
    setFilters((prev) => ({ ...prev, minRent: PRICE_RANGES[idx].min, maxRent: PRICE_RANGES[idx].max }));
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar (full, white bg always since no hero) ──────────────────── */}
      <Navbar />

      {/* ── Page Hero Header ─────────────────────────────────────────────── */}
      <section className="w-full bg-white px-8 pt-40 pb-12 md:px-16 lg:px-40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <Eyebrow label="Property Listings" />
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-black md:text-5xl lg:text-6xl">
              Discover homes<br />that fit your lifestyle
            </h1>
          </div>
          <div className="max-w-sm">
            <p className="text-neutral-500 leading-relaxed">
              Explore a range of verified properties built for comfort, location, and everyday living — all with transparent pricing.
            </p>
            <Link
              href="/onboarding/landlord"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              List Your Property <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Search Bar (full width) ───────────────────────────────────────── */}
      <div className="px-8 pb-8 md:px-16 lg:px-28">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by address, city or state..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-11 pr-10 py-3.5 border border-neutral-200 rounded-2xl text-sm text-black outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50"
          />
          {filters.search && (
            <button onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Layout: Left Sidebar + Right Cards ───────────────────────── */}
      <div className="px-8 pb-16 md:px-16 lg:px-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ── LEFT SIDEBAR: Filters ────────────────────────────────────── */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-6 sticky top-24">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-black">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* State */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white outline-none focus:border-black transition-all"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white outline-none focus:border-black transition-all"
                  />
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200" />

                {/* Price Range */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-3">Price Range</label>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range, idx) => (
                      <Pill key={idx} active={activePriceRange === idx} onClick={() => setPriceRange(idx)}>
                        {range.label}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200" />

                {/* BHK / Bedrooms */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-3">Bedrooms (BHK)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1", "2", "3", "4"].map((b) => (
                      <Pill key={b} active={filters.bhk === b} onClick={() => f("bhk", b)}>
                        {b === "4" ? "4+" : b}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200" />

                {/* Furnishing */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-3">Furnishing</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "unfurnished",    label: " Unfurnished" },
                      { id: "semi_furnished", label: " Semi-Furnished" },
                      { id: "fully_furnished",label: " Fully Furnished" },
                    ].map((opt) => (
                      <Pill key={opt.id} active={filters.furnishing === opt.id} onClick={() => f("furnishing", opt.id)}>
                        {opt.label}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200" />

                {/* Pets Allowed */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-3">Pets</label>
                  <div className="flex gap-2">
                    <Pill active={filters.petsAllowed === "true"} onClick={() => f("petsAllowed", "true")}>
                       Welcome
                    </Pill>
                    <Pill active={filters.petsAllowed === "false"} onClick={() => f("petsAllowed", "false")}>
                       No Pets
                    </Pill>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Results ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-neutral-500">
                {loading ? "Loading..." : `${properties.length} properties found`}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.search && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    🔍 {filters.search}
                    <button onClick={() => setFilters({ ...filters, search: "" })}><X size={10}/></button>
                  </span>
                )}
                {filters.state && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    📍 {filters.state}
                    <button onClick={() => setFilters({ ...filters, state: "" })}><X size={10}/></button>
                  </span>
                )}
                {filters.city && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    🏙️ {filters.city}
                    <button onClick={() => setFilters({ ...filters, city: "" })}><X size={10}/></button>
                  </span>
                )}
                {filters.bhk && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    🛏️ {filters.bhk === "4" ? "4+ BHK" : `${filters.bhk} BHK`}
                    <button onClick={() => setFilters({ ...filters, bhk: "" })}><X size={10}/></button>
                  </span>
                )}
                {(filters.minRent || filters.maxRent) && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    💰 {PRICE_RANGES[activePriceRange]?.label || "Custom"}
                    <button onClick={() => { setFilters({ ...filters, minRent: "", maxRent: "" }); setActivePriceRange(0); }}><X size={10}/></button>
                  </span>
                )}
                {filters.furnishing && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    {FURNISHING_LABELS[filters.furnishing]}
                    <button onClick={() => setFilters({ ...filters, furnishing: "" })}><X size={10}/></button>
                  </span>
                )}
                {filters.petsAllowed && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[11px] font-semibold">
                    {filters.petsAllowed === "true" ? "🐾 Pets OK" : "🚫 No Pets"}
                    <button onClick={() => setFilters({ ...filters, petsAllowed: "" })}><X size={10}/></button>
                  </span>
                )}
              </div>
            )}

            {/* Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden bg-neutral-100 animate-pulse">
                    <div className="h-52 bg-neutral-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-neutral-200 rounded w-3/4" />
                      <div className="h-3 bg-neutral-200 rounded w-1/2" />
                      <div className="h-6 bg-neutral-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-5">
                  <Home size={36} className="text-neutral-300" />
                </div>
                <h2 className="text-xl font-bold text-black mb-2">No properties found</h2>
                <p className="text-neutral-500 max-w-xs text-sm">
                  Try adjusting your filters or check back soon — new listings are added regularly.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="mt-6 px-6 py-2.5 bg-black text-white rounded-full font-semibold text-sm hover:bg-neutral-800 transition-colors">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {properties.map((prop: any) => (
                  <Link key={prop._id} href={`/properties/${prop._id}`} className="group block">
                    <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {/* Image - Taller visual focus */}
                      <div className="relative h-64 overflow-hidden bg-gray-100">
                        {prop.listingImages?.[0] ? (
                          <img
                            src={prop.listingImages[0]}
                            alt={prop.address}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <Home size={36} /><p className="text-xs mt-2">No image</p>
                          </div>
                        )}
                        {/* Single subtle photo count tag if multiple images exist */}
                        {prop.listingImages?.length > 1 && (
                          <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                            +{prop.listingImages.length - 1} photos
                          </span>
                        )}
                      </div>

                      {/* Clean Card Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-[#1F2937] text-base line-clamp-1">{prop.address}</h3>
                          <p className="text-lg font-black text-[#1F2937] whitespace-nowrap">
                            ₹{Number(prop.rentAmount).toLocaleString("en-IN")}<span className="text-xs font-normal text-gray-400">/mo</span>
                          </p>
                        </div>
                        
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                          <MapPin size={12} />
                          {prop.city}{prop.state ? `, ${prop.state}` : ""}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                            {FURNISHING_LABELS[prop.furnishing] || "Unfurnished"}
                          </span>
                          <span className="text-xs font-bold text-[#0052CC] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA Section — Wider, rectangular black card with centered features ── */}
      <section className="w-full bg-white px-6 py-12 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto bg-black rounded-4xl overflow-hidden shadow-xl">
          <div className="px-8 py-10 md:py-6 text-center">
            {/* Heading */}
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-4xl mb-4">
              Own a property? List it on RentEase
            </h2>
            <p className="text-neutral-400 text-sm md:text-md leading-relaxed max-w-2xl mx-auto mb-6">
              Get verified tenants, digital rental agreements, photo-documented move-ins, and full payment tracking — all in one place.
            </p>
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/onboarding/landlord"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-black hover:bg-neutral-100 transition-colors shadow-md"
              >
                Start Listing <ArrowRight size={15} />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-bold text-white hover:border-white/50 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
            {/* Features in single/double dot-separated inline text */}
            <div className="text-xs md:text-md font-medium text-neutral-400 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 max-w-3xl mx-auto">
              <span>Verified KYC</span>
              <span className="text-neutral-600">•</span>
              <span>Digital Agreements</span>
              <span className="text-neutral-600">•</span>
              <span>Photo Move-in Docs</span>
              <span className="text-neutral-600">•</span>
              <span>Razorpay Payments</span>
              <span className="text-neutral-600">•</span>
              <span>Real-time Notifications</span>
              <span className="text-neutral-600">•</span>
              <span>Maintenance Tracking</span>
            </div>
          </div>
        </div>
      </section>

            {/* ── FAQ Section ──────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
