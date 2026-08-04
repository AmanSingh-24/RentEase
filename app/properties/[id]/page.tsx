"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Home,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Loader2,
  BedDouble,
  Bath,
  Layers,
  Building,
  PawPrint,
  ArrowRight,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import FAQ from "../../components/Faq";
import Footer from "../../components/Footer";
import dynamic from "next/dynamic";

// Dynamically imported to avoid SSR issues with Leaflet's window dependency
const PropertyMap = dynamic(() => import("../../components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-3xl bg-neutral-100 animate-pulse flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-neutral-400" />
    </div>
  ),
});

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

  // Booking state
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  // Load property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/marketplace?id=${id}`);
        const data = await res.json();
        if (res.ok && data.properties?.length > 0) {
          setProperty(data.properties[0]);
        } else {
          setProperty(null);
        }
      } catch (err) {
        console.error("Failed to load property:", err);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  // Check if user is logged in and pre-fill email; also check existing booking
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || null);
          if (data.user) {
            setFormData((prev) => ({ ...prev, name: data.user.name || "", email: data.user.email || "" }));
            if (id) {
              const bRes = await fetch(`/api/bookings/status?propertyId=${id}`);
              const bData = await bRes.json();
              if (bRes.ok && bData.booking) setExistingBooking(bData.booking);
            }
          }
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkSession();
  }, [id]);

  const handleBookClick = () => {
    if (!currentUser) {
      router.push(`/signup?redirect=/properties/${id}`);
      return;
    }
    if (currentUser.role === "owner" || currentUser.role === "admin") {
      setError("Only tenant accounts can book properties.");
      return;
    }
    setShowModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property._id,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setExistingBooking({ status: "pending" });
      } else {
        setError(data.error || "Failed to submit booking request.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isBooked = existingBooking && existingBooking.status !== "rejected";
  const isRejected = existingBooking && existingBooking.status === "rejected";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <Loader2 size={36} className="animate-spin text-black" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24">
          <Home size={56} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Property Not Found</h2>
          <p className="text-gray-400 max-w-sm">This listing may have been removed or is no longer available.</p>
          <Link href="/properties">
            <button className="px-6 py-3 bg-black text-white rounded-full font-semibold text-sm mt-6">
              ← Back to Listings
            </button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = property.listingImages || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16">
        
        {/* Top Header: Badge + Title + Location + Price */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold mb-3">
              <Home size={12} /> For Rent
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight leading-snug max-w-3xl">{property.address}</h1>
            <p className="text-sm text-neutral-500 flex items-center gap-1.5 mt-1.5">
              <MapPin size={15} className="text-neutral-400" />
              {property.city}{property.state ? `, ${property.state}` : ""}{property.pincode ? ` — ${property.pincode}` : ""}
            </p>
          </div>
          <div className="text-left md:text-right flex-shrink-0">
            <p className="text-2xl md:text-4xl font-black text-black">
              ₹{Number(property.rentAmount).toLocaleString("en-IN")}
              <span className="text-xs font-semibold text-neutral-400 ml-1">/mo</span>
            </p>
          </div>
        </div>

        {/* Hero Grid Showcase (Grid layout inspired by screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Main Large Image */}
          <div className="md:col-span-2 relative h-72 md:h-[450px] rounded-3xl overflow-hidden bg-neutral-100 group">
            {images.length > 0 ? (
              <img
                src={images[imageIndex]}
                alt={`Property view ${imageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                <Home size={48} />
                <p className="text-xs mt-2">No photos available</p>
              </div>
            )}
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
              </>
            )}
          </div>

          {/* Right Two Smaller Images Stack */}
          <div className="hidden md:flex flex-col gap-4 h-[450px]">
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-neutral-100 cursor-pointer" onClick={() => setImageIndex(1 % images.length)}>
              {images.length > 1 ? (
                <img src={images[1 % images.length]} alt="Sub detail 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300"><Home size={32} /></div>
              )}
            </div>
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-neutral-100 cursor-pointer" onClick={() => setImageIndex(2 % images.length)}>
              {images.length > 2 ? (
                <img src={images[2 % images.length]} alt="Sub detail 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300"><Home size={32} /></div>
              )}
            </div>
          </div>
        </div>

        {/* Content Layout: Left details + Right sticky black widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (8 cols): Description, Specs table, Amenities */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Description */}
            <div>
              <h2 className="text-2xl font-extrabold text-black mb-4">Description</h2>
              <p className="text-neutral-600 leading-relaxed text-base">
                {property.description || `${property.address} is a beautifully maintained rental unit located in ${property.city}. It offers peaceful living with convenient access to local amenities and transportation.`}
              </p>
            </div>

            {/* Specifications Table (UI matching screenshot specs table) */}
            <div className="bg-neutral-50 rounded-3xl p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-200/60">
                <span className="flex items-center gap-3 text-neutral-700 font-semibold text-sm">
                  <BedDouble size={18} className="text-black" /> Bedrooms
                </span>
                <span className="font-extrabold text-black text-sm">{property.bhk} BHK</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-neutral-200/60">
                <span className="flex items-center gap-3 text-neutral-700 font-semibold text-sm">
                  <Home size={18} className="text-black" /> Furnishing Status
                </span>
                <span className="font-extrabold text-black text-sm">{FURNISHING_LABELS[property.furnishing] || "Unfurnished"}</span>
              </div>

              {property.propertyType && (
                <div className="flex items-center justify-between py-3 border-b border-neutral-200/60">
                  <span className="flex items-center gap-3 text-neutral-700 font-semibold text-sm">
                    <Building size={18} className="text-black" /> Property Type
                  </span>
                  <span className="font-extrabold text-black text-sm capitalize">{property.propertyType}</span>
                </div>
              )}

              {property.floorNumber != null && (
                <div className="flex items-center justify-between py-3 border-b border-neutral-200/60">
                  <span className="flex items-center gap-3 text-neutral-700 font-semibold text-sm">
                    <Layers size={18} className="text-black" /> Floor Number
                  </span>
                  <span className="font-extrabold text-black text-sm">
                    Floor {property.floorNumber} {property.totalFloors ? `of ${property.totalFloors}` : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3 text-neutral-700 font-semibold text-sm">
                  <PawPrint size={18} className="text-black" /> Pet Policy
                </span>
                <span className="font-extrabold text-black text-sm">
                  {property.petsAllowed ? "Pets Allowed 🐾" : "No Pets"}
                </span>
              </div>
            </div>

            {/* Amenities & Features */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-2xl font-extrabold text-black mb-4">Amenities & Features</h2>
                <div className="flex flex-wrap gap-2.5">
                  {property.amenities.map((amenity: string) => (
                    <span key={amenity} className="px-4 py-2.5 bg-neutral-100 rounded-2xl text-sm font-semibold text-neutral-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map — only shown if property has saved coordinates */}
            {property.location?.coordinates?.length === 2 && (
              <div>
                <h2 className="text-2xl font-extrabold text-black mb-4">Location</h2>
                <div className="w-full h-[380px] rounded-3xl overflow-hidden border border-neutral-200 shadow-sm">
                  <PropertyMap
                    lat={property.location.coordinates[1]}
                    lng={property.location.coordinates[0]}
                    address={property.formattedAddress || property.address}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2 ml-1 flex items-center gap-1.5">
                  <MapPin size={12} />
                  Approximate location — exact address shared after booking approval.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Sticky Black Card matching Screenshot */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="bg-black text-white rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col items-center text-center">
              
              {/* RentEase Logo */}
              <div className="relative w-40 h-10 mb-6">
                <Image src="/desk3.png" alt="RentEase" fill className="object-contain invert" priority />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">Like this property?</h3>
              <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6 max-w-xs">
                We'd love to help you explore this home. Reach out to get more details or book a visit directly with the owner.
              </p>

              {/* Feature Pill Items */}
              <div className="w-full space-y-3 mb-8">
                <div className="w-full py-3 px-4 bg-neutral-900 rounded-2xl text-sm font-bold text-neutral-200 border border-neutral-800 flex items-center justify-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" /> Verified Property Listing
                </div>
                <div className="w-full py-3 px-4 bg-neutral-900 rounded-2xl text-sm font-bold text-neutral-200 border border-neutral-800 flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-blue-400" /> Quality Living Spaces
                </div>
                <div className="w-full py-3 px-4 bg-neutral-900 rounded-2xl text-sm font-bold text-neutral-200 border border-neutral-800 flex items-center justify-center gap-2">
                  <Home size={16} className="text-amber-400" /> Smart Real Estate Choice
                </div>
              </div>

              {/* Action Button */}
              {isBooked ? (
                <button
                  disabled
                  className="w-full py-4 bg-neutral-800 text-emerald-400 rounded-full font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Contact Requested
                </button>
              ) : (
                <button
                  onClick={handleBookClick}
                  className="w-full py-4 bg-white text-black hover:bg-neutral-100 transition-colors rounded-full font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  Book the Property <ArrowRight size={16} />
                </button>
              )}

              {isBooked && (
                <p className="text-xs text-emerald-400 mt-3 font-semibold">
                  ✓ Your contact details have been sent to the owner.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => { setShowModal(false); setSubmitted(false); setError(""); }}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">Request Sent!</h3>
                <p className="text-neutral-500 text-sm mb-6">
                  Your contact information has been shared with the property owner. They will reach out to schedule a visit.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 bg-black text-white rounded-full font-bold text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-extrabold text-black mb-1">Book a Visit</h3>
                <p className="text-xs text-neutral-400 mb-6">Share your details to connect with the owner directly.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitBooking}
                    disabled={submitting}
                    className="w-full py-4 bg-black text-white rounded-full font-extrabold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Sending..." : "Send Contact Details"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <FAQ />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
