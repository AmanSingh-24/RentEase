"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Upload, ChevronRight, Loader2, X,
  Plus, Home, MapPin, Sparkles, Camera, UserCheck, FileText,
  Minus, ShieldCheck, AlertCircle, Bed, Building, Building2,
  Layout, Box, Layers, Warehouse, PawPrint, Ban, Search, FileCheck, Rocket, Edit2,
  HelpCircle, Zap, Lightbulb, Mail, ArrowRight
} from "lucide-react";
import AddressMapPicker, { type GeoLocation } from "../../components/AddressMapPicker";

// ── Constants & Clean Lucide Icon Mappings ────────────────────────────────────

const PROPERTY_TYPES = [
  { id: "1bhk", label: "1 BHK", icon: Bed, desc: "1 bedroom, hall, kitchen" },
  { id: "2bhk", label: "2 BHK", icon: Home, desc: "2 bedrooms, hall, kitchen" },
  { id: "3bhk", label: "3 BHK", icon: Building, desc: "3 bedrooms, hall, kitchen" },
  { id: "4bhk", label: "4+ BHK", icon: Building2, desc: "Large family home" },
  { id: "studio", label: "Studio", icon: Layout, desc: "Open plan compact living" },
  { id: "villa", label: "Villa", icon: Warehouse, desc: "Standalone villa / bungalow" },
];

const FURNISHING_OPTIONS = [
  { id: "unfurnished", label: "Unfurnished", icon: Box, desc: "No furniture provided" },
  { id: "semi_furnished", label: "Semi-Furnished", icon: Layers, desc: "Essential furniture included" },
  { id: "fully_furnished", label: "Fully Furnished", icon: Sparkles, desc: "Ready to move in, fully equipped" },
];

const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Parking", "Generator Backup",
  "Gym", "Lift / Elevator", "CCTV Security", "Security Guard",
  "Swimming Pool", "Garden / Park", "Balcony", "Gas Pipeline",
  "Water 24x7", "Club House", "Kids Play Area",
];

const TOTAL_STEPS = 8;

// ── Sub-components ────────────────────────────────────────────────────────────

function FileUploadBox({ label, hint, value, onChange, accept = "image/*,application/pdf" }: {
  label: string; hint: string; value: string; onChange: (b: string) => void; accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isImage = value && value.startsWith("data:image/");
  const isPdf = value && (value.startsWith("data:application/pdf") || value.includes("pdf"));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 transition-all">
          <div className="flex items-center gap-4">
            {isImage ? (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <img src={value} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800">
                <FileText size={32} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Document Attached</span>
              </div>
              <p className="mt-1 text-sm font-bold text-neutral-900 truncate">{label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isImage ? "Image file attached" : isPdf ? "PDF Document attached" : "File attached"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-red-600 transition-colors shadow-sm"
              title="Remove document"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center cursor-pointer hover:border-black hover:bg-neutral-50/50 transition-all select-none"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-colors mb-3">
            <Upload size={22} />
          </div>
          <p className="font-bold text-neutral-900 text-sm">{label}</p>
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
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
  const [showHelpSidebar, setShowHelpSidebar] = useState(false);

  // Step 1 — Property Type
  const [propertyType, setPropertyType] = useState("");

  // Step 2 — Location
  const [location, setLocation] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    lat: 0,
    lng: 0,
    formattedAddress: "",
  });

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

  // ── Form Step Condition Check (Used to enable/disable Next button) ──────────
  const isCurrentStepValid = (): boolean => {
    if (step === 1) return Boolean(propertyType);
    if (step === 2) {
      const hasAddr = Boolean(location.formattedAddress.trim() || location.address.trim());
      const hasCity = Boolean(location.city.trim());
      return hasAddr && hasCity;
    }
    if (step === 3) return Boolean(features.furnishing);
    if (step === 4) return photos.length > 0;
    if (step === 5) return Boolean(pricing.rentAmount);
    if (step === 6) {
      if (isVerifiedHost) return true;
      return Boolean(
        ownerDetails.kycFullName.trim() &&
        ownerDetails.kycPhone.trim() &&
        ownerDetails.idDocumentBase64
      );
    }
    if (step === 7) return Boolean(ownershipProof);
    if (step === 8) return true;
    return true;
  };

  // ── Validation & Step Nav ──────────────────────────────────────────────────
  const validate = (): boolean => {
    setError("");
    if (!isCurrentStepValid()) {
      if (step === 1) setError("Please select a property type to continue.");
      else if (step === 2) setError("Please select an address and enter the city.");
      else if (step === 3) setError("Please select a furnishing status.");
      else if (step === 4) setError("Please upload at least one photo.");
      else if (step === 5) setError("Monthly rent amount is required.");
      else if (step === 6) setError("Please complete all required KYC fields and upload your ID.");
      else if (step === 7) setError("Please upload your property ownership document.");
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
          address: location.formattedAddress || location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
          latitude: location.lat || undefined,
          longitude: location.lng || undefined,
          formattedAddress: location.formattedAddress || undefined,
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-neutral-900">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-200">
            <CheckCircle size={40} className="text-neutral-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">You're All Set! 🎉</h1>
          <p className="text-neutral-500 mb-8 text-sm md:text-base leading-relaxed">
            Your property listing has been submitted and is under review. Our verification team will review your application within <strong className="text-neutral-900">24–48 hours</strong>.
          </p>

          <div className="bg-neutral-50 rounded-3xl p-6 text-left border border-neutral-200 mb-8 space-y-4">
            {[
              { icon: Search, title: "Identity & KYC Check", desc: "Verifying government identification" },
              { icon: FileCheck, title: "Property Ownership Audit", desc: "Checking submitted deed & tax receipt" },
              { icon: Rocket, title: "Marketplace Listing", desc: "Property goes live on public search" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neutral-800 border border-neutral-200 flex-shrink-0">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-neutral-900 text-sm">{item.title}</p>
                  <p className="text-xs text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { window.location.href = "/"; }}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const stepValid = isCurrentStepValid();
  const selectedTypeObj = PROPERTY_TYPES.find((t) => t.id === propertyType);
  const selectedFurnishObj = FURNISHING_OPTIONS.find((f) => f.id === features.furnishing);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      {/* ── Top Header (Increased Logo & Button Sizes) ────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-6 lg:px-12 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-[180px] h-[48px]">
            <Image src="/desk3.png" alt="RentEase" fill className="object-contain object-left" priority />
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowHelpSidebar(true)}
            className="px-5 py-2.5 rounded-full border border-neutral-300 text-sm font-bold text-neutral-800 hover:border-neutral-900 hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-2"
          >
            <HelpCircle size={16} /> Need help?
          </button>
        </div>
      </header>

      {/* ── Slide-over Help Drawer (Right Side) ───────────────────────────── */}
      <AnimatePresence>
        {showHelpSidebar && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpSidebar(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            />

            {/* Right Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 text-neutral-900"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-950">Need Help?</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">We're here to make listing your property simple. Here's what you'll need.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpSidebar(false)}
                  className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                  title="Close help"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {/* 1. Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 flex-shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">Property Address</h3>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Enter the complete property address where your tenants will stay. Include house number, street, city and pincode.
                    </p>
                  </div>
                </div>

                {/* 2. Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 flex-shrink-0 mt-0.5">
                    <Home size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">Property Details</h3>
                    <p className="text-xs text-neutral-600 mt-1 mb-2">Add basic information like:</p>
                    <ul className="text-xs text-neutral-600 space-y-1 pl-1">
                      {["Property type", "BHK", "Floor", "Furnishing", "Monthly rent", "Security deposit"].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Photos */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 flex-shrink-0 mt-0.5">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">Upload Property Photos</h3>
                    <p className="text-xs text-neutral-600 mt-1 mb-2">Upload clear photos of the property. Best results include:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Living Room", "Bedrooms", "Kitchen", "Bathrooms", "Balcony (if available)"].map((room, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-neutral-100 text-[11px] font-semibold text-neutral-800 border border-neutral-200">
                          {room}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Ownership Proof */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 flex-shrink-0 mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">Ownership Proof</h3>
                    <p className="text-xs text-neutral-600 mt-1 mb-1.5">Upload a valid ownership document for verification. Examples:</p>
                    <ul className="text-xs text-neutral-600 space-y-1 pl-1 mb-2">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Sale Deed</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Property Tax Receipt</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Registered Ownership Document</li>
                    </ul>
                    <p className="text-[11px] text-neutral-500 italic bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                      Your documents are securely stored and only used for verification.
                    </p>
                  </div>
                </div>

                {/* 5. Property Location */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 flex-shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">Property Location</h3>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Search your property's address and place the map pin accurately. This helps tenants locate your property easily.
                    </p>
                  </div>
                </div>

                {/* 6. What happens next? */}
                <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <h3 className="font-extrabold text-neutral-950 text-sm flex items-center gap-2">
                    <Zap size={16} className="text-neutral-900" /> What happens next?
                  </h3>
                  <ol className="text-xs text-neutral-700 space-y-2 font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold">1</span>
                      Complete the form
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold">2</span>
                      Submit your listing
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold">3</span>
                      Our team verifies your documents
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold">4</span>
                      Once approved, your property goes live
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold">5</span>
                      You can manage everything digitally from your dashboard
                    </li>
                  </ol>
                </div>

                {/* 7. Tips for faster approval */}
                <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-3">
                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-300" /> Tips for faster approval
                  </h3>
                  <ul className="text-xs text-neutral-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      Use clear property photos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      Enter the correct address
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      Upload a valid ownership document
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      Double-check rent and contact details
                    </li>
                  </ul>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-3">
                <p className="text-xs font-extrabold text-neutral-950 uppercase tracking-wider">Still have questions?</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                    <Mail size={14} className="text-neutral-900" /> support@rentease.com
                  </span>
                  <a
                    href="mailto:support@rentease.com?subject=RentEase%20Host%20Onboarding%20Help"
                    className="flex items-center gap-1 font-bold text-neutral-950 underline hover:text-neutral-600 transition-colors"
                  >
                    Contact Support <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step Body Content ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 pt-10 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Step {step} of {TOTAL_STEPS}
            </span>

            {/* ── STEP 1: Property Type ─────────────────────────────────── */}
            {step === 1 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Which of these best describes your place?
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Choose the option that fits your property configuration.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {PROPERTY_TYPES.map((type) => {
                    const isSelected = propertyType === type.id;
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setPropertyType(type.id)}
                        className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900 shadow-sm"
                            : "border-neutral-200 hover:border-neutral-400 bg-white"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-4">
                          <IconComponent size={24} />
                        </div>
                        <p className="font-bold text-neutral-900 text-base">{type.label}</p>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 2: Location ──────────────────────────────────────── */}
            {step === 2 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Where is your property located?
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Your address is only shared with tenants after their booking application is approved.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Search Property Address *
                    </label>
                    <AddressMapPicker
                      placeholder="Enter street, landmark, area, or society name..."
                      initialValue={
                        location.lat
                          ? { lat: location.lat, lng: location.lng, formattedAddress: location.formattedAddress }
                          : undefined
                      }
                      onChange={(geo: GeoLocation) => {
                        setLocation((prev) => ({
                          ...prev,
                          formattedAddress: geo.formattedAddress,
                          address: geo.formattedAddress,
                          city: geo.city || prev.city,
                          state: geo.state || prev.state,
                          pincode: geo.pincode || prev.pincode,
                          lat: geo.lat,
                          lng: geo.lng,
                        }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={location.city}
                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={location.state}
                        onChange={(e) => setLocation({ ...location, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={location.pincode}
                      onChange={(e) => setLocation({ ...location, pincode: e.target.value })}
                      placeholder="e.g. 400001"
                      className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:border-neutral-900 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Features & Amenities ──────────────────────────── */}
            {step === 3 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Share some basics &amp; amenities
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Help prospective tenants understand what your property includes.
                </p>

                <div className="space-y-8">
                  {/* Furnishing Status */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-3">
                      Furnishing Status *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {FURNISHING_OPTIONS.map((f) => {
                        const isSelected = features.furnishing === f.id;
                        const IconComp = f.icon;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFeatures({ ...features, furnishing: f.id })}
                            className={`p-5 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                                : "border-neutral-200 hover:border-neutral-400 bg-white"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-3">
                              <IconComp size={20} />
                            </div>
                            <p className="font-bold text-neutral-900 text-sm">{f.label}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{f.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Building Type */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-3">
                      Building Type
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { id: "apartment", label: "Apartment", icon: Building2 },
                        { id: "house", label: "House", icon: Home },
                        { id: "villa", label: "Villa", icon: Warehouse },
                        { id: "studio", label: "Studio", icon: Layout },
                        { id: "pg", label: "PG", icon: Bed },
                      ].map((t) => {
                        const isSelected = features.propertyType === t.id;
                        const BIcon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFeatures({ ...features, propertyType: t.id })}
                            className={`px-5 py-3 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all ${
                              isSelected
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                            }`}
                          >
                            <BIcon size={16} /> {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Floor Details Counters */}
                  <div className="border-t border-neutral-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <div>
                        <p className="font-bold text-neutral-900 text-sm">Floor Number</p>
                        <p className="text-xs text-neutral-500">Which floor is the unit located on</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFeatures((prev) => ({ ...prev, floorNumber: String(Math.max(0, Number(prev.floorNumber || 0) - 1)) }))}
                          className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-black text-neutral-700 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-neutral-900 text-sm">
                          {features.floorNumber || "0"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFeatures((prev) => ({ ...prev, floorNumber: String(Number(prev.floorNumber || 0) + 1) }))}
                          className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-black text-neutral-700 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <div>
                        <p className="font-bold text-neutral-900 text-sm">Total Floors</p>
                        <p className="text-xs text-neutral-500">Total floors in the building</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFeatures((prev) => ({ ...prev, totalFloors: String(Math.max(1, Number(prev.totalFloors || 1) - 1)) }))}
                          className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-black text-neutral-700 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-neutral-900 text-sm">
                          {features.totalFloors || "1"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFeatures((prev) => ({ ...prev, totalFloors: String(Number(prev.totalFloors || 1) + 1) }))}
                          className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-black text-neutral-700 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-bold text-neutral-900 text-sm">Pets Allowed</p>
                        <p className="text-xs text-neutral-500">Can tenants bring pets</p>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { val: true, label: "Allowed", icon: PawPrint },
                          { val: false, label: "No Pets", icon: Ban },
                        ].map((opt) => {
                          const isSelected = features.petsAllowed === opt.val;
                          const PIcon = opt.icon;
                          return (
                            <button
                              key={String(opt.val)}
                              type="button"
                              onClick={() => setFeatures((prev) => ({ ...prev, petsAllowed: opt.val }))}
                              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                                isSelected
                                  ? "border-neutral-900 bg-neutral-900 text-white"
                                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white"
                              }`}
                            >
                              <PIcon size={14} /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="border-t border-neutral-100 pt-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-3">
                      Amenities
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {AMENITIES_LIST.map((a) => {
                        const active = features.amenities.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenity(a)}
                            className={`px-4 py-2.5 rounded-full border text-xs font-semibold transition-all ${
                              active
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                            }`}
                          >
                            {active ? "✓ " : ""}{a}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-neutral-100 pt-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Property Description
                    </label>
                    <textarea
                      value={features.description}
                      onChange={(e) => setFeatures({ ...features, description: e.target.value })}
                      placeholder="Describe your property highlights, view, nearby spots, or rules..."
                      rows={4}
                      className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-900 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Photos ────────────────────────────────────────── */}
            {step === 4 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Add some photos of your place
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Listings with clear photos attract 3x more tenant applications. Upload at least 1 photo.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden group border border-neutral-200 bg-neutral-100">
                      <img src={photo} alt={`Property view ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-50 hover:text-red-600"
                        title="Remove photo"
                      >
                        <X size={15} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 bg-neutral-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                          Cover Photo
                        </span>
                      )}
                    </div>
                  ))}

                  {photos.length < 10 && (
                    <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-neutral-50/50 transition-all group p-4 text-center">
                      <Plus size={26} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                      <p className="text-xs font-bold text-neutral-700 mt-2">Add Photo</p>
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
                  <p className="text-xs text-neutral-500 mt-4">
                    {photos.length} photo{photos.length > 1 ? "s" : ""} uploaded · The first photo will be shown on search cards.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 5: Pricing ───────────────────────────────────────── */}
            {step === 5 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Now, set your price
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Set the monthly rent and security deposit for your property.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Monthly Rent (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400">₹</span>
                      <input
                        type="number"
                        value={pricing.rentAmount}
                        onChange={(e) => setPricing({ ...pricing, rentAmount: e.target.value })}
                        placeholder="0"
                        className="w-full pl-10 pr-16 py-4 border border-neutral-200 rounded-2xl text-2xl font-extrabold text-neutral-950 outline-none focus:border-neutral-900 transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">/month</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Security Deposit (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400">₹</span>
                      <input
                        type="number"
                        value={pricing.depositAmount}
                        onChange={(e) => setPricing({ ...pricing, depositAmount: e.target.value })}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-4 border border-neutral-200 rounded-2xl text-2xl font-extrabold text-neutral-950 outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>

                  {pricing.rentAmount && (
                    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                        Move-in Summary
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">First Month Rent</span>
                          <span className="font-bold text-neutral-900">₹{Number(pricing.rentAmount).toLocaleString("en-IN")}</span>
                        </div>
                        {pricing.depositAmount && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Security Deposit</span>
                            <span className="font-bold text-neutral-900">₹{Number(pricing.depositAmount).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div className="border-t border-neutral-200 pt-2 flex justify-between font-extrabold text-base">
                          <span>Total Move-in Cost</span>
                          <span className="text-neutral-900">
                            ₹{(Number(pricing.rentAmount) + Number(pricing.depositAmount || 0)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 6: Owner Identity (KYC) ──────────────────────────── */}
            {step === 6 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Verify your identity
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-6">
                  Government ID verification is required for all RentEase hosts to prevent fraud and build community trust.
                </p>

                {isVerifiedHost && (
                  <div className="mb-6 p-4 bg-neutral-900 text-white rounded-2xl flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Identity Already Verified ✓</p>
                      <p className="text-xs text-neutral-300">Your host identity and Govt ID are on file. You can proceed without re-uploading.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        value={ownerDetails.kycFullName}
                        onChange={(e) => setOwnerDetails({ ...ownerDetails, kycFullName: e.target.value })}
                        placeholder="As shown on your Govt ID"
                        className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={ownerDetails.kycPhone}
                        onChange={(e) => setOwnerDetails({ ...ownerDetails, kycPhone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Government Photo ID *
                    </label>
                    <FileUploadBox
                      label="Upload Aadhaar / PAN / Passport / Voter ID"
                      hint="Supports JPG, PNG, or PDF files"
                      value={ownerDetails.idDocumentBase64}
                      onChange={(v) => setOwnerDetails({ ...ownerDetails, idDocumentBase64: v })}
                    />
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3 text-xs text-neutral-500">
                    <ShieldCheck size={18} className="text-neutral-700 flex-shrink-0 mt-0.5" />
                    <p>Your ID is stored with bank-grade encryption and only accessed by RentEase compliance officers. It is never displayed publicly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 7: Ownership Proof ───────────────────────────────── */}
            {step === 7 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Upload property ownership proof
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-6">
                  Provide an official document showing your right to lease this property.
                </p>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">Accepted Documents:</p>
                  <ul className="text-xs text-neutral-600 space-y-1.5">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neutral-800" /> Property Tax Receipt (latest year)</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neutral-800" /> Registered Sale Deed / Purchase Agreement</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neutral-800" /> Electricity / Water Bill in owner's name</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <FileUploadBox
                    label="Upload Property Tax Receipt or Sale Deed"
                    hint="Supports JPG, PNG, or PDF files"
                    value={ownershipProof}
                    onChange={setOwnershipProof}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 8: Full Form Review ───────────────────────────────── */}
            {step === 8 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 mb-3">
                  Review your listing &amp; details
                </h1>
                <p className="text-neutral-500 text-sm md:text-base mb-8">
                  Check everything carefully before submitting your application for admin review.
                </p>

                <div className="space-y-6">
                  {/* Section 1: Property Type */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">01. Property Type</span>
                      <p className="font-bold text-neutral-900 text-lg mt-1 flex items-center gap-2">
                        {selectedTypeObj && <selectedTypeObj.icon size={20} className="text-neutral-700" />}
                        {selectedTypeObj?.label || propertyType.toUpperCase()}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{selectedTypeObj?.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 2: Location */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">02. Location</span>
                      <p className="font-bold text-neutral-900 text-base mt-1 flex items-center gap-1.5">
                        <MapPin size={16} className="text-neutral-700 flex-shrink-0" />
                        {location.city ? `${location.city}, ${location.state || ""}` : "Location provided"}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-md">
                        {location.formattedAddress || location.address || "Address saved"}
                      </p>
                      {location.pincode && <p className="text-xs text-neutral-400 mt-0.5">Pincode: {location.pincode}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 3: Basics & Features */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">03. Basics &amp; Amenities</span>
                      <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                        <div><span className="text-neutral-500">Furnishing:</span> <strong className="text-neutral-900 ml-1">{selectedFurnishObj?.label || "—"}</strong></div>
                        <div><span className="text-neutral-500">Building Type:</span> <strong className="text-neutral-900 ml-1 capitalize">{features.propertyType || "—"}</strong></div>
                        <div><span className="text-neutral-500">Floor:</span> <strong className="text-neutral-900 ml-1">Floor {features.floorNumber || "0"} of {features.totalFloors || "1"}</strong></div>
                        <div><span className="text-neutral-500">Pets Policy:</span> <strong className="text-neutral-900 ml-1">{features.petsAllowed ? "Allowed" : "No Pets"}</strong></div>
                      </div>
                      {features.amenities.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[11px] text-neutral-500 block mb-1 font-semibold">Included Amenities:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {features.amenities.map((a) => (
                              <span key={a} className="px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-[11px] font-bold text-neutral-800">
                                ✓ {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {features.description && (
                        <p className="text-xs text-neutral-600 mt-3 italic bg-white p-3 rounded-xl border border-neutral-200">
                          "{features.description}"
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600 flex-shrink-0"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 4: Photos */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">04. Property Photos ({photos.length})</span>
                      <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-1">
                        {photos.map((p, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
                            <img src={p} alt="Thumbnail" className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-neutral-900 text-white text-[8px] font-bold text-center py-0.5">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600 flex-shrink-0"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 5: Pricing */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">05. Pricing</span>
                      <div className="flex items-baseline gap-4 mt-1">
                        <p className="font-extrabold text-neutral-900 text-xl">
                          ₹{Number(pricing.rentAmount || 0).toLocaleString("en-IN")} <span className="text-xs font-normal text-neutral-500">/month</span>
                        </p>
                        {pricing.depositAmount && (
                          <p className="text-xs text-neutral-600 font-semibold">
                            Deposit: ₹{Number(pricing.depositAmount).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 6: Identity / KYC */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">06. Identity Verification</span>
                      {isVerifiedHost ? (
                        <p className="font-bold text-neutral-900 text-sm mt-1 flex items-center gap-1.5">
                          <CheckCircle size={16} className="text-emerald-600" />
                          Verified RentEase Host Profile
                        </p>
                      ) : (
                        <div className="mt-1 text-xs space-y-0.5">
                          <p className="font-bold text-neutral-900">{ownerDetails.kycFullName}</p>
                          <p className="text-neutral-500">Phone: {ownerDetails.kycPhone}</p>
                          <p className="text-emerald-700 font-semibold mt-1">✓ Govt Photo ID Uploaded</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  {/* Section 7: Ownership Proof */}
                  <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">07. Ownership Document</span>
                      <p className="font-bold text-neutral-900 text-sm mt-1 flex items-center gap-1.5">
                        <CheckCircle size={16} className="text-emerald-600" />
                        Property Deed / Tax Receipt Document Uploaded
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(7)}
                      className="flex items-center gap-1 text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mt-6 p-4 bg-neutral-900 text-white rounded-xl flex items-center gap-3 text-xs font-medium">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Fixed Bottom Navigation Bar (Airbnb Style) ────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 py-4 px-6 md:px-12 z-30 flex items-center justify-between">
        {/* Segmented Progress Bar across top edge of footer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100 flex">
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx + 1 <= step ? "bg-neutral-900" : "bg-transparent"
              } ${idx < TOTAL_STEPS - 1 ? "border-r border-white" : ""}`}
            />
          ))}
        </div>

        {/* Back Button (Returns to Landing Page on Step 1, or previous step on Step > 1) */}
        <div>
          {step === 1 ? (
            <Link
              href="/"
              className="px-7 py-2.5 rounded-xl border-1 border-neutral-950 text-sm text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all shadow-sm inline-block"
            >
              Back
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="px-7 py-2.5 rounded-xl border-1 border-neutral-900 text-sm text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all shadow-sm"
            >
              Back
            </button>
          )}
        </div>

        {/* Next / Submit Button (Disabled with gray styling when step conditions aren't met) */}
        <div>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!stepValid}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                stepValid
                  ? "bg-neutral-900 hover:bg-black text-white cursor-pointer active:scale-95"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!stepValid || submitting}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
                stepValid && !submitting
                  ? "bg-neutral-900 hover:bg-black text-white cursor-pointer active:scale-95"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
              }`}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle size={16} /> Submit for Review</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
