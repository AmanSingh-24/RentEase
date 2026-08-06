"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bell, Camera, Wrench, CreditCard, Settings, LogOut, Loader2, Lock, MessageSquare, ClipboardList, X, Menu } from "lucide-react";

import DashboardHeader from "../components/DashboardHeader";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasProperty, setHasProperty] = useState<boolean | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string>("none"); // none, pending, verified, rejected
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkTenancy = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        
        if (res.ok && data.user) {
          setUser(data.user);
          setHasProperty(Boolean(data.user.propertyId)); 

          if (data.user.propertyId) {
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-neutral-900" size={40} />
    </div>
  );

  const navItems = [
    { name: "Overview", href: "/dashboard-tenant", icon: LayoutDashboard, protected: false },
    { name: "Applications", href: "/dashboard-tenant/applications", icon: ClipboardList, protected: false },
    { name: "Activity", href: "/dashboard-tenant/activity", icon: Bell, protected: false },
    { name: "Witness", href: "/dashboard-tenant/witness", icon: Camera, protected: false },
    { name: "Messages", href: "/dashboard-tenant/messages", icon: MessageSquare, protected: true },
    { name: "Maintenance", href: "/dashboard-tenant/maintenance", icon: Wrench, protected: true },
    { name: "Payments", href: "/dashboard-tenant/payments", icon: CreditCard, protected: true },
    { name: "Settings", href: "/dashboard-tenant/settings", icon: Settings, protected: false },
    { name: "Exit", href: "/dashboard-tenant/exit", icon: LogOut, protected: true },
  ];

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* ── Left Sidebar (Full Height from top:0) ─────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white border-r border-neutral-200/80 fixed inset-y-0 left-0 z-50 transition-all duration-300 ${
          collapsed ? "w-20 p-3" : "w-64 p-5"
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Top: "Tenant Dashboard" text + X button when open, or Icon when collapsed */}
          {!collapsed ? (
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-neutral-100">
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold text-neutral-950 tracking-tight leading-tight">Tenant</span>
                <span className="text-xs font-semibold text-neutral-500 tracking-wide">Dashboard</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-all cursor-pointer"
                title="Collapse to Icon Strip"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center pt-1 pb-2 border-b border-neutral-100">
              <button
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Expand Sidebar"
              >
                <Menu size={20} />
              </button>
            </div>
          )}

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isLocked = item.protected && inspectionStatus !== "verified";
              const isActive = pathname === item.href;
              
              return (
                <div key={item.name} className="relative">
                  <Link 
                    href={isLocked ? "#" : item.href} 
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 py-3 rounded-2xl transition-all font-semibold text-xs ${
                      collapsed ? "justify-center px-0" : "px-3.5"
                    } ${
                      isActive 
                        ? "bg-neutral-950 text-white shadow-md shadow-neutral-950/10 font-bold" 
                        : isLocked 
                          ? "opacity-40 cursor-not-allowed text-neutral-400" 
                          : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
                    }`}
                  >
                    <item.icon size={18} className={isActive ? "text-white" : "text-neutral-500"} />
                    {!collapsed && <span className="tracking-tight">{item.name}</span>}
                    {!collapsed && isLocked && <Lock size={12} className="ml-auto text-neutral-400" />}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {!collapsed && (
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-center">
            <p className="text-[11px] font-bold text-neutral-900">RentEase Tenant Portal</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Verified Digital Residency</p>
          </div>
        )}
      </aside>

      {/* ── Main Layout Wrapper ─────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        {/* Top Navbar Header */}
        <DashboardHeader
          user={user}
          collapsed={collapsed}
          onOpenSidebar={() => setCollapsed(false)}
        />

        {/* Main Viewport Content */}
        <main className="flex-1 bg-white p-6 md:p-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}