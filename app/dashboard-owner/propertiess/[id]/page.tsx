"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, IndianRupee, ShieldCheck, ArrowLeft, 
  Copy, Check, Share2, Building2, Calendar, User, Mail, History, UserX,
  FileText, PenTool, CheckCircle2, Phone, Sparkles, Loader2
} from "lucide-react";
import SignaturePad from "../../../components/SignaturePad"; // Path confirmed
import dynamic from "next/dynamic";

const PropertyMapComp = dynamic(() => import("../../../components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center min-h-[250px] rounded-xl">
      <Loader2 size={24} className="animate-spin text-neutral-400" />
    </div>
  ),
});

type InfoTab = "tenant" | "history";

export default function PropertyDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("tenant");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/properties/get-single?id=${id}`);
      const data = await res.json();
      if (res.ok) setProperty(data.property);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const copyCode = () => {
    if (!property) return;
    navigator.clipboard.writeText(property.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    if (!property) return;
    const message = `Hey! Use code *${property.inviteCode}* to join the property at *${property.address}* on RentEase.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleOwnerSign = async (signatureImg: string) => {
    setIsSealing(true);
    try {
      const res = await fetch("/api/onboarding/owner-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property._id, signatureImg })
      });
      if (res.ok) {
        await fetchDetails(); // Refresh details
      }
    } catch (err) {
      console.error("Signing error:", err);
    } finally {
      setIsSealing(false);
    }
  };

  if (!property) {
    return (
      <div className="h-[60vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <LoaderSpinner />
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Accessing Property Vault...</p>
        </div>
      </div>
    );
  }

  const isAgreementFullySealed = property.agreement?.isSignedByTenant && property.agreement?.isSignedByOwner;
  const imageUrls = property.listingImages && property.listingImages.length > 0 ? property.listingImages : [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Breadcrumb back button ────────────────────────────────────────────── */}
      <button 
        onClick={() => router.push("/dashboard-owner/propertiess")} 
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all shadow-3xs active:scale-95 cursor-pointer border-0"
      >
        <ArrowLeft size={13} /> Return to Portfolio
      </button>

      {/* ── Grid Workspace Layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Asset parameters, invite details, and tenant tabs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Title card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                property.status === 'vacant' ? 'bg-amber-50 text-amber-700 border-amber-200/50' : 
                property.status === 'under_notice' ? 'bg-red-50 text-red-700 border-red-200/50 animate-pulse' :
                'bg-emerald-50 text-emerald-700 border-emerald-200/50'
              }`}>
                {property.status.replace("_", " ")}
              </span>
              
              {isAgreementFullySealed && (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} /> Legally Sealed
                </span>
              )}
            </div>
            
            <div>
              <h1 className="text-xl font-extrabold text-neutral-950 tracking-tight leading-snug">
                {property.address}
              </h1>
              <p className="text-xs text-neutral-500 font-semibold mt-1 flex items-center gap-1.5">
                <MapPin size={11} /> {property.city} · {property.bhk || 1} BHK
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-4">
              <div>
                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Monthly Rent</p>
                <p className="text-sm font-black text-neutral-900 mt-0.5">₹{Number(property.rentAmount || 0).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Security Deposit</p>
                <p className="text-sm font-black text-neutral-900 mt-0.5">₹{Number(property.depositAmount || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Tenant Details / Past History */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
            
            {/* Tabs Trigger bar */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
              <button
                onClick={() => setActiveTab("tenant")}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === "tenant" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Resident Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === "history" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Residency History ({property.pastTenants?.length || 0})
              </button>
            </div>

            {/* Tab content viewports */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {activeTab === "tenant" ? (
                  <motion.div
                    key="tenant-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="space-y-4"
                  >
                    {property.tenantId ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black uppercase text-xs shrink-0">
                            {property.tenantId.name?.charAt(0) || "T"}
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div>
                              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Occupant Name</p>
                              <p className="text-xs font-black text-neutral-950 leading-snug">{property.tenantId.name}</p>
                            </div>
                            
                            {/* Contact entries placed below name */}
                            <div className="space-y-1 text-xs text-neutral-500 font-semibold border-t border-neutral-200/50 pt-1.5 mt-1 bg-transparent">
                              <div className="flex items-center gap-1.5">
                                <Mail size={11} className="text-neutral-400 shrink-0" />
                                <a href={`mailto:${property.tenantId.email}`} className="hover:underline hover:text-neutral-950 truncate block">
                                  {property.tenantId.email}
                                </a>
                              </div>
                              {property.tenantContact?.phone && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Phone size={11} className="text-neutral-400 shrink-0" />
                                  <a href={`tel:${property.tenantContact.phone}`} className="hover:underline hover:text-neutral-950 block">
                                    {property.tenantContact.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Seal signature section */}
                        {property.agreement?.isSignedByTenant && !property.agreement?.isSignedByOwner && (
                          <div className="p-4 bg-indigo-50/50 border border-indigo-200/50 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                              <PenTool size={14} className="text-indigo-600 shrink-0" />
                              <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Action: Counter-Sign Lease</p>
                            </div>
                            <SignaturePad onSave={handleOwnerSign} />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Unassigned: Show simple empty state
                      <div className="space-y-4 text-center py-10 bg-neutral-50 rounded-xl border border-neutral-200/60 border-dashed flex flex-col items-center justify-center">
                        <Sparkles size={32} className="text-neutral-300 mx-auto mb-2" />
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">No Active Tenant</h4>
                        <p className="text-[10px] text-neutral-400 font-medium max-w-[200px]">This property is currently vacant and waiting for a new resident.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="history-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="space-y-2"
                  >
                    {property.pastTenants?.length > 0 ? (
                      property.pastTenants.map((past: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/50 flex justify-between items-center opacity-85 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-neutral-200 text-neutral-700 rounded-lg flex items-center justify-center font-black uppercase text-xs shrink-0">
                              <UserX size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-neutral-900 truncate leading-snug">{past.tenantId?.name || past.name || "Unknown Tenant"}</p>
                              <p className="text-[9px] text-neutral-400 font-semibold truncate flex items-center gap-1 mt-0.5"><Mail size={10}/> {past.tenantId?.email || past.email || "N/A"}</p>
                              {(past.tenantId?.kycDetails?.phone || past.tenantId?.phone) && (
                                <p className="text-[9px] text-neutral-400 font-semibold truncate flex items-center gap-1 mt-0.5"><Phone size={10}/> {past.tenantId?.kycDetails?.phone || past.tenantId?.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Moved out</p>
                            <p className="text-[10px] font-bold text-neutral-600 mt-0.5">{new Date(past.movedOutAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-neutral-400">
                        <p className="text-[10px] font-black uppercase tracking-wider">No Previous Tenancies</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Property gallery, single map location pin, and Baseline evidence photos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Leaflet Property Location Map */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Property Location Map
            </h3>
            <div className="h-64 rounded-xl overflow-hidden border border-neutral-200/60 shadow-3xs relative">
              {property.location?.coordinates && property.location.coordinates.length === 2 ? (
                <PropertyMapComp 
                  lat={property.location.coordinates[1]} 
                  lng={property.location.coordinates[0]} 
                  address={property.address} 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-400">
                  <MapPin size={24} className="opacity-60 mb-1" />
                  <p className="text-[10px] font-black uppercase tracking-wider">No Geolocation Coordinates available</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Gallery */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Asset Gallery & Listing Images
              </h3>
              <span className="bg-neutral-100 border border-neutral-200/30 text-neutral-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {imageUrls.length} Photos
              </span>
            </div>

            {imageUrls.length === 0 ? (
              <div className="h-48 rounded-xl bg-neutral-50 border border-neutral-200/40 border-dashed flex flex-col items-center justify-center text-center">
                <Building2 size={28} className="text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No listing images available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageUrls.map((url: string, i: number) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200/60 shadow-3xs group">
                    <img 
                      src={url} 
                      alt={`Listing ${i}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condition audit logs if exists */}
          {property.images && property.images.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-5">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Digital Audit Baseline Evidence
                </h3>
                <span className="bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {property.images.length} Evidence Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.images.map((img: any, i: number) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200/60 shadow-3xs group">
                    <img src={img.url} alt="Evidence photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Move-In Proof Item</p>
                      <p className="text-[9px] text-neutral-300 font-semibold mt-0.5">Timestamp: {new Date(img.timestamp).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline fallback loader icon
function LoaderSpinner() {
  return (
    <div className="relative w-8 h-8 animate-spin">
      <div className="absolute inset-0 border-2 border-neutral-200 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-t-neutral-950 rounded-full"></div>
    </div>
  );
}