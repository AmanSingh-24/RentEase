"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Home,
  ShieldCheck,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

const FURNISHING_LABELS: Record<string, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-Furnished",
  fully_furnished: "Fully Furnished",
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  // Apply modal state
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    monthlyIncome: "",
    occupantsCount: "1",
    targetMoveInDate: "",
    notes: "",
  });

  // Load property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // Use the marketplace endpoint (public, safe, no sensitive data)
        const res = await fetch(`/api/properties/marketplace?city=`);
        const data = await res.json();
        if (res.ok) {
          const found = data.properties?.find((p: any) => p._id === id);
          if (found) {
            setProperty(found);
          } else {
            // Fallback: try fetching directly by querying all (handles after filter clear)
            setProperty(null);
          }
        }
      } catch (err) {
        console.error("Failed to load property:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch single property detail via a dedicated single endpoint
    const fetchSingle = async () => {
      try {
        const res = await fetch(`/api/properties/get-single?propertyId=${id}`);
        const data = await res.json();
        // get-single may require auth — if it fails use marketplace
        if (res.ok && data.property) {
          // Strip sensitive data before using
          const { inviteCode, structure, agreement, tenantId, ...safe } = data.property;
          setProperty(safe);
        } else {
          await fetchProperty();
        }
      } catch {
        await fetchProperty();
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSingle();
  }, [id]);

  // Check if user is logged in (for Apply button)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || null);
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkSession();
  }, []);

  const handleApplyClick = () => {
    if (!currentUser) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/properties/${id}`);
      return;
    }
    if (currentUser.role !== "tenant") {
      setError("Only tenant accounts can apply for properties. Please sign in as a tenant.");
      return;
    }
    setShowModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!formData.fullName || !formData.phone) {
      setError("Full name and phone number are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          ...formData,
          monthlyIncome: Number(formData.monthlyIncome),
          occupantsCount: Number(formData.occupantsCount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit application.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0052CC]" size={40} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <Home size={48} className="text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-600">Property not found</h1>
        <p className="text-gray-400">This listing may have been removed or is no longer available.</p>
        <Link href="/properties">
          <button className="px-6 py-3 bg-[#0052CC] text-white rounded-xl font-bold text-sm mt-4">
            ← Back to Listings
          </button>
        </Link>
      </div>
    );
  }

  const images = property.listingImages || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/properties" className="flex items-center gap-2 text-gray-500 hover:text-[#1F2937] font-bold text-sm transition-colors">
            <ChevronLeft size={18} /> Back to Listings
          </Link>
          <span className="text-gray-200">|</span>
          <Link href="/" className="font-black text-lg text-[#1F2937] tracking-tight">
            Rent<span className="text-[#0052CC]">Ease</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column: Images + Details ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <div className="relative bg-gray-200 rounded-2xl overflow-hidden h-72 md:h-96">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[imageIndex]}
                    alt={`Property image ${imageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setImageIndex(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${i === imageIndex ? "bg-white" : "bg-white/40"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Home size={48} />
                  <p className="text-sm mt-2">No photos available</p>
                </div>
              )}

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0" />
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === imageIndex ? "border-[#0052CC] scale-105" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Property Title & Location */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-[#0052CC] text-xs font-black px-3 py-1 rounded-full">
                      {property.bhk} BHK
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      property.furnishing === "fully_furnished" ? "bg-teal-50 text-teal-700" :
                      property.furnishing === "semi_furnished" ? "bg-blue-50 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {FURNISHING_LABELS[property.furnishing] || "Unfurnished"}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-[#1F2937]">{property.address}</h1>
                  <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} />
                    {property.city}{property.state ? `, ${property.state}` : ""}{property.pincode ? ` — ${property.pincode}` : ""}
                  </p>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <h3 className="font-black text-[#1F2937] mb-2 text-sm uppercase tracking-wide">About This Property</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-black text-[#1F2937] mb-4 text-sm uppercase tracking-wide">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity: string) => (
                    <span key={amenity} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                      <CheckCircle size={14} className="text-[#10B981]" /> {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Pricing + Apply ───────────────────────────────── */}
          <div className="space-y-4">
            {/* Pricing Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                <p className="text-4xl font-black text-[#1F2937]">
                  ₹{Number(property.rentAmount).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="py-4 border-t border-b border-gray-50 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Security Deposit</span>
                  <span className="font-bold text-[#1F2937]">
                    ₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-bold text-[#1F2937]">{property.bhk} BHK</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Furnishing</span>
                  <span className="font-bold text-[#1F2937]">
                    {FURNISHING_LABELS[property.furnishing] || "—"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handleApplyClick}
                className="w-full py-4 bg-[#0052CC] text-white rounded-xl font-black text-sm hover:bg-[#0041a3] transition-colors shadow-lg shadow-blue-200"
              >
                {currentUser?.role === "tenant" ? "Apply for Rent" : "Sign In to Apply"}
              </button>

              {!currentUser && (
                <p className="text-[10px] text-gray-400 text-center mt-3">
                  You need to be signed in as a tenant to apply.
                </p>
              )}
            </div>

            {/* Verified Landlord Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0052CC]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={24} className="text-[#0052CC]" />
                </div>
                <div>
                  <p className="font-black text-[#1F2937] text-sm">Verified Landlord ✓</p>
                  <p className="text-xs text-gray-400">
                    {property.ownerId?.name || "Verified Owner"}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-green-700 font-medium">
                  🔒 This landlord's identity and property ownership have been verified by RentEase Admin. Contact info is protected — communicate through the platform after applying.
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#1F2937] rounded-2xl p-6 text-white">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <IndianRupee size={16} /> Move-in Cost
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">First Month Rent</span>
                  <span className="font-bold">₹{Number(property.rentAmount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Security Deposit</span>
                  <span className="font-bold">₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="font-black text-white">Total Move-in</span>
                  <span className="font-black text-[#10B981]">
                    ₹{(Number(property.rentAmount) + Number(property.depositAmount || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rental Application Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#1F2937]">Apply for Rent</h2>
                  <p className="text-sm text-gray-400 mt-1">{property.address}</p>
                </div>
                <button
                  onClick={() => { setShowModal(false); setSubmitted(false); setError(""); }}
                  className="text-gray-400 hover:text-black transition-colors p-1"
                >
                  <X size={22} />
                </button>
              </div>

              {submitted ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-[#10B981]" />
                  </div>
                  <h3 className="text-xl font-black text-[#1F2937] mb-2">Application Submitted!</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    The landlord will review your application and may request your Govt ID before finalizing the lease.
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
                    <p className="text-xs font-bold text-[#0052CC] uppercase tracking-wide mb-2">What happens next?</p>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Landlord reviews your profile</li>
                      <li>If pre-approved, you'll be asked to upload Govt ID</li>
                      <li>Landlord finalizes & you get tenancy dashboard access</li>
                    </ol>
                  </div>
                  <Link href="/dashboard-tenant/applications">
                    <button className="w-full py-3 bg-[#0052CC] text-white rounded-xl font-bold text-sm">
                      Track Your Applications →
                    </button>
                  </Link>
                </div>
              ) : (
                /* Application Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Monthly Income (₹)</label>
                      <input
                        type="number"
                        value={formData.monthlyIncome}
                        onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                        placeholder="e.g. 50000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Occupants</label>
                      <select
                        value={formData.occupantsCount}
                        onChange={(e) => setFormData({ ...formData, occupantsCount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] bg-white mt-1"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Target Move-in Date</label>
                    <input
                      type="date"
                      value={formData.targetMoveInDate}
                      onChange={(e) => setFormData({ ...formData, targetMoveInDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Anything you'd like the landlord to know..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0052CC] resize-none mt-1"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-[#0052CC] font-medium">
                      🔒 Your Govt ID will only be requested if the landlord pre-approves this application. We protect your privacy.
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="w-full py-4 bg-[#0052CC] text-white rounded-xl font-black text-sm hover:bg-[#0041a3] transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
