"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Home, SlidersHorizontal, X } from "lucide-react";

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

export default function MarketplacePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    bhk: "",
    minRent: "",
    maxRent: "",
    furnishing: "",
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.set("city", filters.city);
      if (filters.bhk) params.set("bhk", filters.bhk);
      if (filters.minRent) params.set("minRent", filters.minRent);
      if (filters.maxRent) params.set("maxRent", filters.maxRent);
      if (filters.furnishing) params.set("furnishing", filters.furnishing);

      const res = await fetch(`/api/properties/marketplace?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setProperties(data.properties || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = () => fetchListings();

  const clearFilters = () => {
    setFilters({ city: "", bhk: "", minRent: "", maxRent: "", furnishing: "" });
  };

  const hasActiveFilters =
    filters.city || filters.bhk || filters.minRent || filters.maxRent || filters.furnishing;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-[#1F2937] tracking-tight">
            Rent<span className="text-[#0052CC]">Ease</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#1F2937] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#0052CC] text-white rounded-xl text-sm font-bold hover:bg-[#0041a3] transition-colors shadow-md shadow-blue-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          {/* Desktop: Inline Filter Row */}
          <div className="hidden md:flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-44 outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">BHK</label>
              <select
                value={filters.bhk}
                onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-32 outline-none focus:border-[#0052CC] bg-white"
              >
                <option value="">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Rent (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minRent}
                onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-32 outline-none focus:border-[#0052CC]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Rent (₹)</label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxRent}
                onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-32 outline-none focus:border-[#0052CC]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Furnishing</label>
              <select
                value={filters.furnishing}
                onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-44 outline-none focus:border-[#0052CC] bg-white"
              >
                <option value="">Any Furnishing</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi-Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold text-sm hover:bg-[#0041a3] transition-colors shadow-md shadow-blue-200"
              >
                <Search size={16} /> Search
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Toggle Filters */}
          <div className="md:hidden">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by city..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC]"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-200 rounded-xl"
              >
                <SlidersHorizontal size={18} className="text-gray-500" />
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-[#0052CC] text-white rounded-xl"
              >
                <Search size={18} />
              </button>
            </div>
            {showFilters && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <select
                  value={filters.bhk}
                  onChange={(e) => setFilters({ ...filters, bhk: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                </select>
                <select
                  value={filters.furnishing}
                  onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="">Any Furnishing</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi</option>
                  <option value="fully_furnished">Fully Furnished</option>
                </select>
                <input
                  type="number"
                  placeholder="Min Rent (₹)"
                  value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Rent (₹)"
                  value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Property Grid ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1F2937]">
              {loading
                ? "Finding properties..."
                : `${properties.length} Properties Available`}
            </h1>
            {hasActiveFilters && !loading && (
              <p className="text-sm text-gray-400 mt-1">
                Filtered results — <button onClick={clearFilters} className="text-[#0052CC] font-bold">clear filters</button>
              </p>
            )}
          </div>
          <Link
            href="/onboarding/landlord"
            className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
          >
            List Your Property →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3 mt-2" />
                  <div className="h-10 bg-gray-100 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Home size={40} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">No properties found</h2>
            <p className="text-gray-400 max-w-xs">
              Try adjusting your search filters, or check back soon — new properties are added regularly.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-3 bg-[#0052CC] text-white rounded-xl font-bold text-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop: any) => (
              <div
                key={prop._id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                {/* Property Image */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {prop.listingImages?.[0] ? (
                    <img
                      src={prop.listingImages[0]}
                      alt={prop.address}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Home size={40} />
                      <p className="text-xs mt-2">No image</p>
                    </div>
                  )}
                  {/* BHK Badge */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0052CC] text-xs font-black px-3 py-1 rounded-full shadow-sm">
                    {prop.bhk} BHK
                  </span>
                  {/* Available Badge */}
                  <span className="absolute top-3 right-3 bg-[#10B981] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Available
                  </span>
                  {/* Image Count */}
                  {prop.listingImages?.length > 1 && (
                    <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                      +{prop.listingImages.length - 1} photos
                    </span>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-5">
                  <h3 className="font-bold text-[#1F2937] mb-1 line-clamp-1 text-sm">{prop.address}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                    <MapPin size={11} />
                    {prop.city}
                    {prop.state ? `, ${prop.state}` : ""}
                    {prop.pincode ? ` — ${prop.pincode}` : ""}
                  </p>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Monthly Rent</p>
                      <p className="text-2xl font-black text-[#1F2937]">
                        ₹{Number(prop.rentAmount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                        FURNISHING_COLORS[prop.furnishing] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {FURNISHING_LABELS[prop.furnishing] || "Unfurnished"}
                    </span>
                  </div>

                  {/* Verified Landlord Badge + Amenities */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-[9px] font-bold text-[#10B981] bg-green-50 px-2 py-1 rounded-full">
                      ✓ Verified Landlord
                    </span>
                    {prop.amenities?.slice(0, 2).map((amenity: string) => (
                      <span key={amenity} className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {prop.amenities?.length > 2 && (
                      <span className="text-[9px] text-gray-400">
                        +{prop.amenities.length - 2} more
                      </span>
                    )}
                  </div>

                  <Link href={`/properties/${prop._id}`}>
                    <button className="w-full py-3 bg-[#1F2937] text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
                      View Details →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && properties.length > 0 && (
          <div className="mt-12 bg-[#1F2937] rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-black mb-2">Own a property?</h3>
            <p className="text-gray-400 text-sm mb-4">
              List it on RentEase and get verified tenants with digital evidence protection.
            </p>
            <Link
              href="/onboarding/landlord"
              className="inline-block px-6 py-3 bg-[#0052CC] text-white rounded-xl font-bold text-sm hover:bg-[#0041a3] transition-colors"
            >
              List Your Property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
