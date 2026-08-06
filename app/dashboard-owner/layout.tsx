"use client";
// ✅ MARKETPLACE EXPANSION: Applications nav added

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, Building2, Wrench, ShieldCheck, IndianRupee, 
  Settings, LogOut, PlusCircle, X, Plus, MessageSquare, LayoutTemplate, ClipboardList, UserCheck, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyProvider, useProperty } from "../context/PropertyContext";
import AddressMapPicker, { type GeoLocation } from "../components/AddressMapPicker";

// ✅ ADDED MESSAGES TO THE CORE PORFOLIO HUB NAVIGATION MATRIX
const ownerNavItems = [
  { name: "Portfolio", href: "/dashboard-owner", icon: LayoutGrid, color: "#1F2937" },
  { name: "Properties", href: "/dashboard-owner/propertiess", icon: Building2, color: "#0052CC" },
  { name: "Applications", href: "/dashboard-owner/applications", icon: ClipboardList, color: "#8B5CF6" },
  { name: "Onboard Customers", href: "/dashboard-owner/onboarding", icon: UserCheck, color: "#10B981" },
  { name: "Messages", href: "/dashboard-owner/messages", icon: MessageSquare, color: "#3B82F6" },
  { name: "Maintenance", href: "/dashboard-owner/maintenance", icon: Wrench, color: "#F59E0B" },
  { name: "Inspections", href: "/dashboard-owner/inspections", icon: ShieldCheck, color: "#0D9488" },
  { name: "Financials", href: "/dashboard-owner/financials", icon: IndianRupee, color: "#10B981" },
  { name: "Settings", href: "/dashboard-owner/settingss", icon: Settings, color: "#6B7280" },
  { name: "Exit Notices", href: "/dashboard-owner/exit", icon: LogOut, color: "#6B7280" },
];

function ModalManager() {
  const { isModalOpen, editingProperty, closeModal } = useProperty();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>("");
  
  useEffect(() => {
    // Fetch session user to get ownerId
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok) setOwnerId(data.user._id);
      } catch (err) {
        console.error("Failed to fetch user session", err);
      }
    };
    fetchUser();
  }, []);
  
  const [propertyData, setPropertyData] = useState({
    address: "", rentAmount: "", depositAmount: "", rooms: "1",
    furnishing: "unfurnished", guidelines: "", gracePeriodDays: "7",
    repairThreshold: "500", lockInMonths: "11", noticePeriodDays: "30",
    templateType: "1BHK", images: [] as string[],
    lat: 0, lng: 0, formattedAddress: "",
  });

  useEffect(() => {
    if (isModalOpen && editingProperty) {
      setPropertyData({
        address: editingProperty.address || "",
        rentAmount: editingProperty.rentAmount?.toString() || "",
        depositAmount: editingProperty.depositAmount?.toString() || "",
        rooms: editingProperty.roomDetails?.rooms?.toString() || "1",
        furnishing: editingProperty.roomDetails?.furnishing || "unfurnished",
        guidelines: Array.isArray(editingProperty.guidelines) ? editingProperty.guidelines.join(", ") : editingProperty.guidelines || "",
        gracePeriodDays: editingProperty.maintenanceRules?.gracePeriodDays?.toString() || "7",
        repairThreshold: editingProperty.maintenanceRules?.repairThreshold?.toString() || "500",
        lockInMonths: editingProperty.exitPolicy?.lockInMonths?.toString() || "11",
        noticePeriodDays: editingProperty.exitPolicy?.noticePeriodDays?.toString() || "30",
        templateType: editingProperty.templateType || "1BHK",
        images: [],
        lat: editingProperty.location?.coordinates?.[1] || 0,
        lng: editingProperty.location?.coordinates?.[0] || 0,
        formattedAddress: editingProperty.formattedAddress || editingProperty.address || "",
      });
      setStep(1); 
    } else if (isModalOpen && !editingProperty) {
      setPropertyData({ 
        address: "", rentAmount: "", depositAmount: "", rooms: "1", 
        furnishing: "unfurnished", guidelines: "", gracePeriodDays: "7", 
        repairThreshold: "500", lockInMonths: "11", noticePeriodDays: "30", 
        templateType: "1BHK", images: [],
        lat: 0, lng: 0, formattedAddress: "",
      });
      setStep(1);
    }
  }, [editingProperty, isModalOpen]);

  const handleSubmit = async () => {
    if (!propertyData.address.trim()) return alert("Property Address is required to initialize the vault.");
    setLoading(true);
    try {
      const isEditing = !!(editingProperty && editingProperty._id); 
      const endpoint = isEditing ? "/api/properties/update" : "/api/properties/create";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        address: propertyData.formattedAddress || propertyData.address,
        rentAmount: Number(propertyData.rentAmount),
        depositAmount: Number(propertyData.depositAmount),
        ownerId: ownerId,
        templateType: propertyData.templateType,
        roomDetails: { rooms: Number(propertyData.rooms), furnishing: propertyData.furnishing },
        maintenanceRules: { gracePeriodDays: Number(propertyData.gracePeriodDays), repairThreshold: Number(propertyData.repairThreshold) },
        exitPolicy: { lockInMonths: Number(propertyData.lockInMonths), noticePeriodDays: Number(propertyData.noticePeriodDays) },
        guidelines: typeof propertyData.guidelines === 'string' ? propertyData.guidelines.split(",").map(s => s.trim()) : propertyData.guidelines,
        images: propertyData.images || [],
        latitude: propertyData.lat || undefined,
        longitude: propertyData.lng || undefined,
        formattedAddress: propertyData.formattedAddress || undefined,
        ...(isEditing && { propertyId: editingProperty._id }) 
      };

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeModal();
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={20} /></button>
            <div className="p-8 md:p-12">
              <div className="flex gap-2 mb-10">
                {[1, 2].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-[#0052CC]' : 'bg-gray-100'}`} />)}
              </div>

              {step === 1 ? (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">Property Asset Details</h2>
                  <div className="space-y-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Location Identity *</label>
                       <AddressMapPicker
                         placeholder="Search property address..."
                         initialValue={
                           propertyData.lat
                             ? { lat: propertyData.lat, lng: propertyData.lng, formattedAddress: propertyData.formattedAddress }
                             : undefined
                         }
                         onChange={(geo: GeoLocation) => {
                           setPropertyData((prev) => ({
                             ...prev,
                             address: geo.formattedAddress,
                             formattedAddress: geo.formattedAddress,
                             lat: geo.lat,
                             lng: geo.lng,
                           }));
                         }}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Monthly Rent (₹)</label><input type="number" value={propertyData.rentAmount} className="w-full p-5 bg-gray-50 rounded-2xl border font-black text-emerald-600" onChange={e => setPropertyData({...propertyData, rentAmount: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Security Deposit (₹)</label><input type="number" value={propertyData.depositAmount} className="w-full p-5 bg-gray-50 rounded-2xl border font-black text-blue-600" onChange={e => setPropertyData({...propertyData, depositAmount: e.target.value})} /></div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2 flex items-center gap-1.5"><LayoutTemplate size={12} className="text-blue-500" /> Property Blueprint</label>
                      <select value={propertyData.templateType} className="w-full p-5 bg-gray-50 rounded-2xl border text-sm font-bold preference-none" onChange={e => setPropertyData({...propertyData, templateType: e.target.value})}>
                        <option value="1BHK">1 BHK Standard Template</option>
                        <option value="2BHK">2 BHK Family Template</option>
                        <option value="Villa">VillaBlueprint</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select value={propertyData.rooms} className="p-5 bg-gray-50 rounded-2xl border font-bold" onChange={e => setPropertyData({...propertyData, rooms: e.target.value})}><option value="1">1 Bedroom</option><option value="2">2 Bedrooms</option></select>
                      <select value={propertyData.furnishing} className="p-5 bg-gray-50 rounded-2xl border font-bold" onChange={e => setPropertyData({...propertyData, furnishing: e.target.value})}><option value="unfurnished">Unfurnished</option><option value="semi">Semi</option></select>
                    </div>
                    <textarea value={propertyData.guidelines} placeholder="House Rules..." rows={3} className="w-full p-5 bg-gray-50 rounded-2xl border resize-none font-medium" onChange={e => setPropertyData({...propertyData, guidelines: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-[#1F2937]">Baseline Assets</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {propertyData.images.map((img, i) => <img key={i} src={img} className="aspect-square rounded-2xl object-cover" />)}
                    <label className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"><Plus size={24} className="text-gray-300" /><input type="file" multiple className="hidden" onChange={handleImage} /></label>
                  </div>
                </div>
              )}

              <div className="mt-12 flex gap-4">
                {step > 1 && <button onClick={() => setStep(1)} className="px-8 py-4 font-bold text-gray-400">Back</button>}
                <button onClick={() => step === 1 ? setStep(2) : handleSubmit()} className="flex-1 bg-[#1F2937] text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">{loading ? "Syncing..." : step === 1 ? "Next Step" : "Initialize Asset"}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import DashboardHeader from "../components/DashboardHeader";

// THE COMPONENT EXPOSING LINK INTERFACES
function Sidebar({
  openModal,
  pathname,
  collapsed,
  onClose,
  onOpen,
}: {
  openModal: (p: any) => void;
  pathname: string;
  collapsed: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-white border-r border-neutral-200/80 fixed inset-y-0 left-0 z-50 transition-all duration-300 ${
        collapsed ? "w-20 p-3" : "w-64 p-5"
      }`}
    >
      <div className="space-y-6">
        {/* Sidebar Top: "Host Dashboard" text + X button when open, or Icon when collapsed */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-neutral-100">
            <div className="flex flex-col text-left">
              <span className="text-sm font-extrabold text-neutral-950 tracking-tight leading-tight">Host</span>
              <span className="text-xs font-semibold text-neutral-500 tracking-wide">Dashboard</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-all cursor-pointer"
              title="Collapse to Icon Strip"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center pt-1 pb-2 border-b border-neutral-100">
            <button
              onClick={onOpen}
              className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Expand Sidebar"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        <nav className="space-y-1">
          {ownerNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 py-3 rounded-2xl transition-all font-semibold text-xs ${
                  collapsed ? "justify-center px-0" : "px-3.5"
                } ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-md shadow-neutral-950/10 font-bold"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-white" : "text-neutral-500"} />
                {!collapsed && <span className="tracking-tight">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => openModal(null)}
          title={collapsed ? "Add Property" : undefined}
          className={`w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-black text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
            collapsed ? "p-3" : "p-3.5"
          }`}
        >
          <PlusCircle size={16} />
          {!collapsed && <span>Add New Property</span>}
        </button>
      </div>
    </aside>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PropertyProvider>
      <LayoutContent>{children}</LayoutContent>
    </PropertyProvider>
  );
}

// COMPONENT HYDRATION RENDER ROOT
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openModal } = useProperty();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        console.error("Session missing or invalid verification parameters");
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* Sidebar starting from top: 0 */}
      <Sidebar
        openModal={openModal}
        pathname={pathname}
        collapsed={collapsed}
        onClose={() => setCollapsed(true)}
        onOpen={() => setCollapsed(false)}
      />

      {/* Main Area Next to Sidebar */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        <DashboardHeader
          user={user}
          collapsed={collapsed}
          onOpenSidebar={() => setCollapsed(false)}
        />
        <main className="flex-1 bg-white p-6 md:p-10 min-w-0">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <ModalManager />
      </div>
    </div>
  );
}