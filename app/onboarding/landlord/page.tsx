"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Upload, ChevronRight, ChevronLeft, Loader2, X,
  Plus, Home, MapPin, Sparkles, Camera, IndianRupee, UserCheck, FileText,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: "1bhk", label: "1 BHK", emoji: "🛏️", desc: "1 bedroom, hall, kitchen" },
  { id: "2bhk", label: "2 BHK", emoji: "🏠", desc: "2 bedrooms, hall, kitchen" },
  { id: "3bhk", label: "3 BHK", emoji: "🏡", desc: "3 bedrooms, hall, kitchen" },
  { id: "4bhk", label: "4+ BHK", emoji: "🏘️", desc: "Large family home" },
  { id: "studio", label: "Studio", emoji: "🏢", desc: "Open plan compact living" },
  { id: "villa", label: "Villa", emoji: "🏰", desc: "Standalone villa / bungalow" },
];

const FURNISHING_OPTIONS = [
  { id: "unfurnished", label: "Unfurnished", emoji: "🪑", desc: "No furniture provided" },
  { id: "semi_furnished", label: "Semi-Furnished", emoji: "🛋️", desc: "Essential furniture included" },
  { id: "fully_furnished", label: "Fully Furnished", emoji: "✨", desc: "Ready to move in, fully equipped" },
];

const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Parking", "Generator Backup",
  "Gym", "Lift / Elevator", "CCTV Security", "Security Guard",
  "Swimming Pool", "Garden / Park", "Balcony", "Gas Pipeline",
  "Water 24x7", "Club House", "Kids Play Area",
];

const TOTAL_STEPS = 7;

const STEP_META = [
  { label: "Type", icon: Home },
  { label: "Location", icon: MapPin },
  { label: "Features", icon: Sparkles },
  { label: "Photos", icon: Camera },
  { label: "Pricing", icon: IndianRupee },
  { label: "Your Details", icon: UserCheck },
  { label: "Proof", icon: FileText },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FileUploadBox({ label, hint, value, onChange, accept = "image/*,application/pdf" }: {
  label: string; hint: string; value: string; onChange: (b: string) => void; accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div
      onClick={() => ref.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
        value
          ? "border-[#10B981] bg-green-50"
          : "border-gray-200 hover:border-[#0052CC] hover:bg-blue-50/30"
      }`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle size={36} className="text-[#10B981]" />
          <p className="font-bold text-[#10B981]">Document uploaded ✓</p>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 mt-1"
          >
            <X size={12} /> Remove & re-upload
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload size={36} className="text-gray-300" />
          <div>
            <p className="font-bold text-gray-600">{label}</p>
            <p className="text-sm text-gray-400 mt-1">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandlordOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Property Type
  const [propertyType, setPropertyType] = useState(""); // maps to bhk field

  // Step 2 — Location
  const [location, setLocation] = useState({ address: "", city: "", state: "", pincode: "" });

  // Step 3 — Features
  const [features, setFeatures] = useState({
    furnishing: "",
    amenities: [] as string[],
    description: "",
    propertyType: "",
    totalFloors: "",
    floorNumber: "",
    petsAllowed: false,
  });

  // Step 4 — Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 5 — Pricing
  const [pricing, setPricing] = useState({ rentAmount: "", depositAmount: "" });

  // Step 6 — Owner Details (KYC)
  const [ownerDetails, setOwnerDetails] = useState({
    kycFullName: "",
    kycPhone: "",
    idDocumentBase64: "",
  });

  // Step 7 — Ownership Proof
  const [ownershipProof, setOwnershipProof] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isVerifiedHost, setIsVerifiedHost] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.hostStatus === "approved" || data.user.role === "owner") {
              setIsVerifiedHost(true);
            }
            setOwnerDetails((prev) => ({
              ...prev,
              kycFullName: data.user.name || "",
            }));
          }
        }
      } catch { /* ignore */ }
    };
    checkUser();
  }, []);

  const toggleAmenity = (a: string) => {
    setFeatures((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPhotos((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    setError("");
    if (step === 1 && !propertyType) {
      setError("Please select a property type to continue.");
      return false;
    }
    if (step === 2) {
      if (!location.address.trim()) { setError("Please enter the property address."); return false; }
      if (!location.city.trim()) { setError("Please enter the city."); return false; }
    }
    if (step === 3 && !features.furnishing) {
      setError("Please select a furnishing status.");
      return false;
    }
    if (step === 4 && photos.length === 0) {
      setError("Please upload at least one photo of the property.");
      return false;
    }
    if (step === 5) {
      if (!pricing.rentAmount) { setError("Monthly rent amount is required."); return false; }
    }
    if (step === 6) {
      if (isVerifiedHost) return true; // Skip re-uploading ID document if host is already verified!
      if (!ownerDetails.kycFullName.trim()) { setError("Your full legal name is required."); return false; }
      if (!ownerDetails.kycPhone.trim()) { setError("Phone number is required."); return false; }
      if (!ownerDetails.idDocumentBase64) { setError("Please upload your Government Photo ID."); return false; }
    }
    if (step === 7 && !ownershipProof) {
      setError("Please upload a property ownership document.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError("");

    // Map propertyType to bhk
    const bhkMap: Record<string, string> = {
      "1bhk": "1", "2bhk": "2", "3bhk": "3", "4bhk": "4",
      studio: "1", villa: "4",
    };

    try {
      const res = await fetch("/api/onboarding/landlord-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ownerDetails,
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
          bhk: bhkMap[propertyType] || "1",
          furnishing: features.furnishing,
          amenities: features.amenities,
          description: features.description,
          propertyType: features.propertyType || undefined,
          totalFloors: features.totalFloors || undefined,
          floorNumber: features.floorNumber || undefined,
          petsAllowed: features.petsAllowed,
          listingImagesBase64: photos,
          rentAmount: pricing.rentAmount,
          depositAmount: pricing.depositAmount,
          ownershipProofBase64: ownershipProof,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
            <CheckCircle size={44} className="text-[#10B981]" />
          </div>
          <h1 className="text-3xl font-black text-[#1F2937] mb-3">You're All Set! 🎉</h1>
          <p className="text-gray-500 mb-2 text-base leading-relaxed">
            Your property listing has been submitted and is now under review.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Our team will verify your details and get back to you within <strong className="text-[#1F2937]">24–48 hours</strong>.
          </p>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8 space-y-4">
            {[
              { icon: "🔍", title: "Identity Verification", desc: "We verify your Govt ID (1–24 hrs)" },
              { icon: "📋", title: "Property Deed Audit", desc: "We check your ownership documents" },
              { icon: "🚀", title: "Go Live on Marketplace", desc: "Your listing appears publicly" },
              { icon: "🏠", title: "Tenant Applications", desc: "Start receiving and managing applicants" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl border border-gray-100 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-[#1F2937] text-sm">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { window.location.href = "/"; }}
            className="w-full py-4 bg-[#0052CC] text-white rounded-2xl font-black text-base hover:bg-[#0041a3] transition-colors shadow-lg shadow-blue-200"
          >
            Back to Home
          </button>
          <p className="text-xs text-gray-400 mt-4">
            We'll notify you by email once your listing is approved.
          </p>
        </div>
      </div>
    );
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-[#1F2937] tracking-tight">
            Rent<span className="text-[#0052CC]">Ease</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400">Step {step} of {TOTAL_STEPS}</span>
            <Link href="/" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Save &amp; Exit
            </Link>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div
            className="h-full bg-[#0052CC] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step Breadcrumbs */}
        <div className="flex items-center gap-1 overflow-x-auto mb-8 pb-1">
          {STEP_META.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                i + 1 < step
                  ? "bg-[#10B981] text-white"
                  : i + 1 === step
                  ? "bg-[#0052CC] text-white shadow-md shadow-blue-200"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {i + 1 < step ? <CheckCircle size={12} /> : <s.icon size={12} />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEP_META.length - 1 && <div className={`w-4 h-0.5 flex-shrink-0 ${i + 1 < step ? "bg-[#10B981]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm">

          {/* ── STEP 1: Property Type ────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">What type of place do you have?</h2>
              <p className="text-gray-400 text-sm mb-8">Select the option that best describes your property.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPropertyType(type.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all ${
                      propertyType === type.id
                        ? "border-[#0052CC] bg-blue-50 shadow-md shadow-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-4xl">{type.emoji}</span>
                    <div>
                      <p className="font-black text-[#1F2937] text-sm">{type.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{type.desc}</p>
                    </div>
                    {propertyType === type.id && (
                      <CheckCircle size={18} className="text-[#0052CC]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Where is your property?</h2>
              <p className="text-gray-400 text-sm mb-8">Only the city and neighborhood will be shown publicly — the full address is revealed only after tenant approval.</p>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Address *</label>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    placeholder="Flat/Door No, Street, Landmark"
                    className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">City *</label>
                    <input
                      type="text"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">State</label>
                    <input
                      type="text"
                      value={location.state}
                      onChange={(e) => setLocation({ ...location, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</label>
                  <input
                    type="text"
                    value={location.pincode}
                    onChange={(e) => setLocation({ ...location, pincode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Features & Amenities ─────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Tell us about your place</h2>
              <p className="text-gray-400 text-sm mb-8">What makes your property special? Help tenants understand what to expect.</p>
              <div className="space-y-8">
                {/* Furnishing */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Furnishing Status *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {FURNISHING_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFeatures({ ...features, furnishing: f.id })}
                        className={`flex flex-col gap-2 p-5 rounded-2xl border-2 text-left transition-all ${
                          features.furnishing === f.id
                            ? "border-[#0052CC] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl">{f.emoji}</span>
                        <p className="font-black text-[#1F2937] text-sm">{f.label}</p>
                        <p className="text-[10px] text-gray-400">{f.desc}</p>
                        {features.furnishing === f.id && <CheckCircle size={16} className="text-[#0052CC] self-end" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Property Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: "apartment", label: "Apartment", emoji: "🏢" },
                      { id: "house",     label: "House",     emoji: "🏠" },
                      { id: "villa",     label: "Villa",     emoji: "🏰" },
                      { id: "studio",    label: "Studio",    emoji: "🛋️" },
                      { id: "pg",        label: "PG",        emoji: "🛏️" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFeatures({ ...features, propertyType: t.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                          features.propertyType === t.id
                            ? "border-[#0052CC] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        <p className="font-black text-[#1F2937] text-xs">{t.label}</p>
                        {features.propertyType === t.id && <CheckCircle size={14} className="text-[#0052CC]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floor Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                      Floor Number <span className="normal-case font-normal">(which floor is the unit)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={features.floorNumber}
                      onChange={(e) => setFeatures({ ...features, floorNumber: e.target.value })}
                      placeholder="e.g. 3"
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                      Total Floors <span className="normal-case font-normal">(in the building)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={features.totalFloors}
                      onChange={(e) => setFeatures({ ...features, totalFloors: e.target.value })}
                      placeholder="e.g. 8"
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>

                {/* Pets Allowed */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Pets Allowed?</label>
                  <div className="flex gap-3">
                    {[{ val: true, label: "Yes, pets welcome 🐾", emoji: "✅" }, { val: false, label: "No pets please", emoji: "🚫" }].map((opt) => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setFeatures({ ...features, petsAllowed: opt.val })}
                        className={`flex-1 py-4 px-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                          features.petsAllowed === opt.val
                            ? "border-[#0052CC] bg-blue-50 text-[#0052CC]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          features.amenities.includes(a)
                            ? "bg-[#0052CC] text-white shadow-md shadow-blue-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {features.amenities.includes(a) ? "✓ " : ""}{a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Property Description</label>
                  <textarea
                    value={features.description}
                    onChange={(e) => setFeatures({ ...features, description: e.target.value })}
                    placeholder="Describe your property — floor number, nearby landmarks, what makes it special..."
                    rows={4}
                    className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Photos ───────────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Add photos of your property</h2>
              <p className="text-gray-400 text-sm mb-8">
                Listings with great photos get 3x more inquiries. Add at least 3 photos — start with the living room.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100">
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={14} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                        Cover Photo
                      </span>
                    )}
                  </div>
                ))}
                {photos.length < 10 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#0052CC] hover:bg-blue-50/30 transition-all group">
                    <Plus size={28} className="text-gray-300 group-hover:text-[#0052CC] transition-colors" />
                    <p className="text-xs text-gray-400 group-hover:text-[#0052CC] font-bold mt-2 transition-colors">Add Photos</p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddPhotos}
                    />
                  </label>
                )}
              </div>
              {photos.length > 0 && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                  {photos.length} photo{photos.length > 1 ? "s" : ""} added · first photo will be the cover image
                </p>
              )}
            </div>
          )}

          {/* ── STEP 5: Pricing ──────────────────────────────────────────── */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Set your price</h2>
              <p className="text-gray-400 text-sm mb-8">You can always adjust your price later. We'll suggest a competitive range based on similar properties in your area.</p>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Monthly Rent (₹) *</label>
                  <div className="relative mt-2">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₹</span>
                    <input
                      type="number"
                      value={pricing.rentAmount}
                      onChange={(e) => setPricing({ ...pricing, rentAmount: e.target.value })}
                      placeholder="0"
                      className="w-full pl-10 pr-5 py-5 border border-gray-200 rounded-2xl text-2xl font-black text-[#1F2937] outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-50"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">/month</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Security Deposit (₹)</label>
                  <div className="relative mt-2">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₹</span>
                    <input
                      type="number"
                      value={pricing.depositAmount}
                      onChange={(e) => setPricing({ ...pricing, depositAmount: e.target.value })}
                      placeholder="0"
                      className="w-full pl-10 pr-5 py-5 border border-gray-200 rounded-2xl text-2xl font-black text-[#1F2937] outline-none focus:border-[#0052CC]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1">Typical deposits are 2–3 months rent. Leave blank to specify later.</p>
                </div>

                {pricing.rentAmount && (
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <p className="text-xs font-black text-[#0052CC] uppercase tracking-widest mb-3">Tenant's Move-in Cost Estimate</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">First Month Rent</span><span className="font-bold">₹{Number(pricing.rentAmount).toLocaleString("en-IN")}</span></div>
                      {pricing.depositAmount && <div className="flex justify-between"><span className="text-gray-500">Security Deposit</span><span className="font-bold">₹{Number(pricing.depositAmount).toLocaleString("en-IN")}</span></div>}
                      <div className="border-t border-blue-200 pt-2 flex justify-between font-black">
                        <span>Total Move-in</span>
                        <span className="text-[#10B981]">₹{(Number(pricing.rentAmount) + Number(pricing.depositAmount || 0)).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 6: Owner Details (KYC) ───────────────────────────────── */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Verify your identity</h2>
              <p className="text-gray-400 text-sm mb-6">
                This is only seen by RentEase admins and is never shown publicly. It protects tenants and builds trust in the platform.
              </p>

              {isVerifiedHost && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                  <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Identity Already Verified ✓</p>
                    <p className="text-xs text-green-700">As a verified RentEase Host, your identity &amp; Govt ID are already on file. You can skip re-uploading documents here.</p>
                  </div>
                </div>
              )}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Legal Name *</label>
                    <input
                      type="text"
                      value={ownerDetails.kycFullName}
                      onChange={(e) => setOwnerDetails({ ...ownerDetails, kycFullName: e.target.value })}
                      placeholder="As shown on your Govt ID"
                      className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={ownerDetails.kycPhone}
                      onChange={(e) => setOwnerDetails({ ...ownerDetails, kycPhone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="mt-1 w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Government Photo ID *</label>
                  <FileUploadBox
                    label="Upload Aadhaar / PAN / Passport / Voter ID"
                    hint="JPG, PNG, or PDF — Max 10MB"
                    value={ownerDetails.idDocumentBase64}
                    onChange={(v) => setOwnerDetails({ ...ownerDetails, idDocumentBase64: v })}
                  />
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-400 bg-gray-50 rounded-xl p-4">
                  <span className="text-lg">🔒</span>
                  <p>Your Govt ID is encrypted and stored securely. It is only used for identity verification by RentEase's admin team and is never shared with tenants.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 7: Ownership Proof ───────────────────────────────────── */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-2">Prove you own this property</h2>
              <p className="text-gray-400 text-sm mb-8">
                This document confirms you have the legal right to rent this property. It's reviewed only by RentEase admins and never shown to tenants.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
                <p className="text-sm text-amber-800 font-bold mb-3">📋 Accepted Documents:</p>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-500" /> Property Tax Receipt (latest year)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-500" /> Sale Deed / Registered Purchase Agreement</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-500" /> Electricity bill in owner's name</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-500" /> Municipal Property Extract</li>
                </ul>
              </div>

              <FileUploadBox
                label="Upload Property Tax Receipt / Sale Deed"
                hint="JPG, PNG, or PDF — Max 20MB"
                value={ownershipProof}
                onChange={setOwnershipProof}
              />

              {/* Summary */}
              <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Your Listing Summary</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div><span className="text-gray-400">Type:</span> <span className="font-bold text-[#1F2937] ml-1 uppercase">{propertyType}</span></div>
                  <div><span className="text-gray-400">City:</span> <span className="font-bold text-[#1F2937] ml-1">{location.city || "—"}</span></div>
                  <div><span className="text-gray-400">Rent:</span> <span className="font-bold text-[#10B981] ml-1">₹{Number(pricing.rentAmount || 0).toLocaleString("en-IN")}/mo</span></div>
                  <div><span className="text-gray-400">Deposit:</span> <span className="font-bold text-[#0052CC] ml-1">₹{Number(pricing.depositAmount || 0).toLocaleString("en-IN")}</span></div>
                  <div><span className="text-gray-400">Photos:</span> <span className="font-bold text-[#1F2937] ml-1">{photos.length} uploaded</span></div>
                  <div><span className="text-gray-400">Furnishing:</span> <span className="font-bold text-[#1F2937] ml-1 capitalize">{features.furnishing.replace("_", " ") || "—"}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────── */}
          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <span className="text-red-500 text-lg">⚠</span>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 mt-10">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#0052CC] text-white rounded-2xl font-black text-base hover:bg-[#0041a3] transition-colors shadow-lg shadow-blue-200"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#1F2937] text-white rounded-2xl font-black text-base hover:bg-black transition-colors disabled:opacity-50 shadow-lg"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle size={18} /> Submit for Review</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
