"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bell, Camera, Wrench, CreditCard, Settings, LogOut, Loader2, Lock, MessageSquare } from "lucide-react";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasProperty, setHasProperty] = useState<boolean | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string>("none"); // none, pending, verified, rejected
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  const checkTenancy = async () => {
    try {
      // ✅ FIX: Read directly from /api/auth/me to fetch identity parameters securely
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      
      if (res.ok && data.user) {
        setUser(data.user);
        setHasProperty(Boolean(data.user.propertyId)); 

        // Get Inspection Status if property is linked
        if (data.user.propertyId) {
          // Pass the secure ID returned directly from our server session payload
          const insRes = await fetch(`/api/inspections/get?tenantId=${data.user._id}&type=move-in`);
          const insData = await insRes.json();
          if (insRes.ok && insData.inspection) {
            setInspectionStatus(insData.inspection.status);
          }
        }
      }
    } catch (err) { 
      console.error("Layout verification failure:", err); 
    } finally { 
      setLoading(false); 
    }
  };
  checkTenancy();
}, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#1F2937]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const navItems = [
    { name: "Overview", href: "/dashboard-tenant", icon: LayoutDashboard, protected: false },
    { name: "Activity", href: "/dashboard-tenant/activity", icon: Bell, protected: false },
    { name: "Witness", href: "/dashboard-tenant/witness", icon: Camera, protected: false },
    { name: "Messages", href: "/dashboard-tenant/messages", icon: MessageSquare, protected: true },
    { name: "Maintenance", href: "/dashboard-tenant/maintenance", icon: Wrench, protected: true },
    { name: "Payments", href: "/dashboard-tenant/payments", icon: CreditCard, protected: true },
    { name: "Settings", href: "/dashboard-tenant/settings", icon: Settings, protected: false },
    { name: "Exit", href: "/dashboard-tenant/exit", icon: LogOut, protected: true },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {hasProperty && (
        <aside className="hidden md:flex w-72 bg-[#1F2937] flex-col justify-between p-6 fixed inset-y-0 left-0 z-50 rounded-r-[40px] shadow-2xl">
          <div>
            <div className="mb-12 px-2"><Image src="/desk.png" alt="Logo" width={150} height={40} className="brightness-200" /></div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isLocked = item.protected && inspectionStatus !== "verified";
                
                return (
                  <div key={item.name} className="relative group">
                    <Link 
                      href={isLocked ? "#" : item.href} 
                      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                        pathname === item.href ? "bg-[#0052CC] text-white shadow-lg" : 
                        isLocked ? "opacity-30 cursor-not-allowed text-gray-500" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <item.icon size={22} />
                      <span className="font-bold text-sm tracking-tight">{item.name}</span>
                      {isLocked && <Lock size={14} className="ml-auto text-gray-500" />}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 font-bold transition-all"><LogOut size={18} /> Sign Out</button>
        </aside>
      )}

      <main className={`flex-1 ${hasProperty ? "md:ml-72" : "w-full"} min-h-screen`}>
        {children}
      </main>
    </div>
  );
}