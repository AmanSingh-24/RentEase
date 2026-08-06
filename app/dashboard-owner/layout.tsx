"use client";
// ✅ MARKETPLACE EXPANSION: Applications nav added

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, Building2, Wrench, ShieldCheck, IndianRupee, 
  Settings, LogOut, PlusCircle, X, Plus, MessageSquare, LayoutTemplate, ClipboardList, UserCheck, Menu, FileText, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyProvider, useProperty } from "../context/PropertyContext";
import AddressMapPicker, { type GeoLocation } from "../components/AddressMapPicker";

// ✅ ADDED MESSAGES, DOCUMENT VAULT & ANALYTICS TO THE CORE PORTFOLIO HUB NAVIGATION MATRIX
const ownerNavItems: { name: string; href: string; icon: any; color: string; badgeCount?: number }[] = [
  { name: "Overview", href: "/dashboard-owner", icon: LayoutGrid, color: "#1F2937" },
  { name: "Properties", href: "/dashboard-owner/propertiess", icon: Building2, color: "#0052CC" },
  { name: "Applications", href: "/dashboard-owner/applications", icon: ClipboardList, color: "#8B5CF6" },
  { name: "Onboard Customers", href: "/dashboard-owner/onboarding", icon: UserCheck, color: "#10B981" },
  { name: "Messages", href: "/dashboard-owner/messages", icon: MessageSquare, color: "#3B82F6" },
  { name: "Maintenance", href: "/dashboard-owner/maintenance", icon: Wrench, color: "#F59E0B" },
  { name: "Inspections", href: "/dashboard-owner/inspections", icon: ShieldCheck, color: "#0D9488" },
  { name: "Document Vault", href: "/dashboard-owner/documents", icon: FileText, color: "#6366F1" },
  { name: "Financials", href: "/dashboard-owner/financials", icon: IndianRupee, color: "#10B981" },
  { name: "Analytics", href: "/dashboard-owner/analytics", icon: BarChart3, color: "#EC4899" },
  { name: "Settings", href: "/dashboard-owner/settingss", icon: Settings, color: "#6B7280" },
  { name: "Exit Notices", href: "/dashboard-owner/exit", icon: LogOut, color: "#6B7280" },
];

import AddPropertyModal from "../components/AddPropertyModal";

function ModalManager() {
  const { isModalOpen, editingProperty, closeModal } = useProperty();
  const [ownerId, setOwnerId] = useState<string>("");
  
  useEffect(() => {
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

  return (
    <AddPropertyModal 
      isOpen={isModalOpen} 
      onClose={closeModal} 
      editingProperty={editingProperty} 
      ownerId={ownerId} 
    />
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
            const badgeCount = item.badgeCount;

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
                {!collapsed && badgeCount && badgeCount > 0 && (
                  <span
                    className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                      isActive
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-neutral-950 text-white"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
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
        <main className="flex-1 bg-white p-4 md:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <ModalManager />
      </div>
    </div>
  );
}