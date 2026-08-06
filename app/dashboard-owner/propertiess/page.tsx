"use client";

import React, { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { 
  Trash2, Edit3, Building2, IndianRupee, Eye, Search, 
  MoreVertical, MapPin, Plus, User, Mail, Info, Filter, X, Loader2
} from "lucide-react";
import { useProperty } from "../../context/PropertyContext";
import dynamic from "next/dynamic";

const MultiPropertyMapComp = dynamic(() => import("../../components/MultiPropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center min-h-[350px]">
      <Loader2 size={24} className="animate-spin text-neutral-400" />
    </div>
  ),
});

type StatusFilter = "all" | "vacant" | "occupied" | "under_notice";

export default function PropertiesList() {
  const { openModal } = useProperty();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/properties/get?ownerId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prop: any) => {
    if (prop.status === "occupied") {
      showToast("Delisting locked: This property has an active tenancy in progress. Please process exit procedures first.", "error");
      return;
    }

    if (window.confirm("Are you sure you want to delist this property? This will permanently remove the asset listing.")) {
      try {
        const res = await fetch(`/api/properties/delete?id=${prop._id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          showToast("Property delisted successfully.", "success");
          setProperties(properties.filter((p: any) => p._id !== prop._id));
        } else {
          showToast(data.error || "Delete failed", "error");
        }
      } catch (err) {
        showToast("Network error", "error");
      }
    }
  };

  // Perform search and filter
  const filteredProperties = properties.filter((prop: any) => {
    const matchesSearch = prop.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prop.city && prop.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || prop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast alert banner */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-bold text-xs shadow-xl text-white transition-all duration-300 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* ── Top Header and Add Asset button ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight mb-1">
            Your Properties
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Manage your real estate assets, invite codes, occupancy lifecycles, and tenant logs.
          </p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-950 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} /> Add New Asset
        </button>
      </div>

      {/* ── Search Bar & Status Filter Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
          <input 
            type="text" 
            placeholder="Search by address or city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl outline-none font-semibold text-xs transition-all shadow-3xs"
          />
        </div>

        {/* Filter Selection dropdown */}
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Filter size={13} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full pl-8 pr-8 py-2.5 bg-white border border-neutral-200 focus:border-neutral-900 rounded-xl outline-none font-bold text-xs shadow-3xs cursor-pointer appearance-none text-neutral-800"
          >
            <option value="all">All Units Status</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="under_notice">Under Notice</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 font-bold text-[8px]">▼</div>
        </div>
      </div>

      {/* ── Main Properties Grid & Map split view workspace ────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-270px)] min-h-[450px]">
        {/* LEFT COLUMN: Property Cards list (maximum 2 cards per row) */}
        <div className="flex-1 overflow-y-auto w-full h-full pr-1.5 space-y-4 scrollbar-none">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-white rounded-2xl border border-neutral-200/60 animate-pulse shadow-3xs" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-2xs">
              <Building2 size={40} className="text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-900 mb-1">
                No properties found
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try adjusting your search criteria or add a new property listing to start onboarding.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProperties.map((prop: any, i: number) => {
                const isVacant = prop.status === "vacant";
                const imageUrl = prop.listingImages?.[0] || "";

                return (
                  <motion.div 
                    key={prop._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl border border-neutral-200/80 shadow-2xs overflow-hidden hover:shadow-md transition-all flex flex-col group h-[400px]"
                  >
                    {/* Top Image Preview Card - separated from text */}
                    <div className="h-48 bg-neutral-100 relative overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={prop.address} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-300">
                          <Building2 size={36} />
                        </div>
                      )}

                      {/* Status Badge Top-Right */}
                      <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border ${
                        isVacant ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                        prop.status === "under_notice" ? "bg-red-50 text-red-700 border-red-200/50 animate-pulse" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      }`}>
                        {prop.status.replace("_", " ")}
                      </span>

                    </div>

                    {/* Body Content - separated below the image with extra breathing space padding */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-neutral-950 text-sm leading-snug line-clamp-1 group-hover:text-black-600 transition-colors" title={prop.address}>
                          {prop.address}
                        </h3>
                        <p className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1">
                          <MapPin size={10} className="text-neutral-400" /> {prop.city} · {prop.bhk || 1} BHK
                        </p>
                      </div>

                      {/* Pricing grid */}
                      <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/40">
                        <div>
                          <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Monthly Rent</p>
                          <p className="text-xs font-black text-neutral-900 mt-0.5">
                            ₹{Number(prop.rentAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Security Deposit</p>
                          <p className="text-xs font-black text-neutral-900 mt-0.5">
                            ₹{Number(prop.depositAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action buttons */}
                    <div className="px-5 pb-5 bg-white flex gap-2">
                      <button 
                        onClick={() => router.push(`/dashboard-owner/propertiess/${prop._id}`)}
                        className="flex-1 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-3xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={13} /> Review Details
                      </button>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === prop._id ? null : prop._id);
                          }}
                          className={`p-2 border rounded-xl transition-all cursor-pointer ${
                            activeMenu === prop._id 
                              ? 'bg-neutral-900 text-white border-neutral-900' 
                              : 'bg-white text-neutral-400 border-neutral-200 hover:text-neutral-800'
                          }`}
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenu === prop._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                              <motion.div 
                                initial={{ opacity: 0, y: 5, scale: 0.96 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                exit={{ opacity: 0, y: 5, scale: 0.96 }} 
                                className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-xl shadow-xl border border-neutral-200/80 py-2 z-20 overflow-hidden"
                              >
                                <button 
                                  onClick={() => { openModal(prop); setActiveMenu(null); }} 
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer text-left"
                                >
                                  <Edit3 size={13} className="text-neutral-500" /> Edit Asset
                                </button>
                                <button 
                                  onClick={() => { handleDelete(prop); setActiveMenu(null); }} 
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left border-t border-neutral-100"
                                >
                                  <Trash2 size={13} /> Delist Asset
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Map fixed viewport featuring dynamic pins representing filtered items */}
        <div className="w-full lg:w-[420px] shrink-0 h-full border border-neutral-200/80 rounded-2xl overflow-hidden relative shadow-2xs bg-neutral-100 flex flex-col justify-between">
          <div className="flex-1 w-full relative overflow-hidden">
            <MultiPropertyMapComp properties={filteredProperties} />
          </div>

          {/* Map metadata dashboard footer */}
          <div className="p-3 bg-white border-t border-neutral-200/80 grid grid-cols-3 gap-2 text-center text-[9px] font-extrabold text-neutral-500">
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span>Vacant ({filteredProperties.filter((p: any) => p.status === "vacant").length})</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Occupied ({filteredProperties.filter((p: any) => p.status === "occupied").length})</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span>Notice ({filteredProperties.filter((p: any) => p.status === "under_notice").length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}