"use client";
// ✅ MARKETPLACE EXPANSION: Applications nav added

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, Building2, Wrench, ShieldCheck, IndianRupee, 
  Settings, LogOut, PlusCircle, X, Plus, MessageSquare, LayoutTemplate, ClipboardList, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyProvider, useProperty } from "../context/PropertyContext";

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
    templateType: "1BHK", images: [] as string[]
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
        images: [] 
      });
      setStep(1); 
    } else if (isModalOpen && !editingProperty) {
      setPropertyData({ 
        address: "", rentAmount: "", depositAmount: "", rooms: "1", 
        furnishing: "unfurnished", guidelines: "", gracePeriodDays: "7", 
        repairThreshold: "500", lockInMonths: "11", noticePeriodDays: "30", 
        templateType: "1BHK", images: [] 
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
        address: propertyData.address,
        rentAmount: Number(propertyData.rentAmount),
        depositAmount: Number(propertyData.depositAmount),
        ownerId: ownerId,
        templateType: propertyData.templateType,
        roomDetails: { rooms: Number(propertyData.rooms), furnishing: propertyData.furnishing },
        maintenanceRules: { gracePeriodDays: Number(propertyData.gracePeriodDays), repairThreshold: Number(propertyData.repairThreshold) },
        exitPolicy: { lockInMonths: Number(propertyData.lockInMonths), noticePeriodDays: Number(propertyData.noticePeriodDays) },
        guidelines: typeof propertyData.guidelines === 'string' ? propertyData.guidelines.split(",").map(s => s.trim()) : propertyData.guidelines,
        images: propertyData.images || [],
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
            <button onClick={closeModal} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            <div className="p-8 md:p-12">
              <div className="flex gap-2 mb-10">
                {[1, 2].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-[#0052CC]' : 'bg-gray-100'}`} />)}
              </div>

              {step === 1 ? (
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">Property Asset Details</h2>
                  <div className="space-y-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Location Identity</label>
                       <input type="text" value={propertyData.address} placeholder="Full Property Address" className="w-full p-5 bg-gray-50 rounded-2xl outline-none border border-gray-100 font-bold" onChange={e => setPropertyData({...propertyData, address: e.target.value})} />
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

// THE COMPONENT EXPOSING LINK INTERFACES
function Sidebar({ userName, openModal, pathname }: { userName: string, openModal: (p: any) => void, pathname: string }) {
  return (
    <aside className="hidden md:flex w-72 bg-[#1F2937] flex-col justify-between p-6 fixed inset-y-0 left-0 z-50 rounded-r-[40px] shadow-2xl">
      <div>
        <div className="mb-12 px-2"><Image src="/desk.png" alt="RentEase" width={150} height={40} className="brightness-200" /></div>
        <nav className="space-y-2">
          {ownerNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${isActive ? "bg-[#0052CC] text-white shadow-lg shadow-blue-500/20 scale-105" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                <item.icon size={22} style={{ color: isActive ? "#FFFFFF" : item.color }} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="pt-6 border-t border-white/10">
        <button onClick={() => openModal(null)} className="w-full flex items-center justify-center gap-3 bg-[#0052CC] text-white p-4 rounded-2xl font-bold text-xs mb-6 hover:bg-[#0041a3] transition-all"><PlusCircle size={18} /> Add New Property</button>
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-white border uppercase">{userName.charAt(0)}</div>
          <div><p className="text-sm font-bold text-white leading-none">{userName}</p><p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mt-1">Portfolio Owner</p></div>
        </div>
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
  const [user, setUser] = useState({ name: "User" });

useEffect(() => {
  const fetchUser = async () => {
    // ✅ FIX: Drop localStorage completely. Call our secure endpoint directly.
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
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar userName={user.name} openModal={openModal} pathname={pathname} />
      <main className="flex-1 md:ml-72 min-h-screen relative">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      <ModalManager />
    </div>
  );
}