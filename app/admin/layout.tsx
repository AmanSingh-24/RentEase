"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  LogOut,
  Loader2,
} from "lucide-react";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "KYC Queue", href: "/admin/dashboard?tab=landlords", icon: Users },
  { name: "Listings Queue", href: "/admin/dashboard?tab=properties", icon: Building2 },
  { name: "Oversight", href: "/admin/dashboard?tab=oversight", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user?.role === "admin") {
          setAdmin({ name: data.user.name, email: data.user.email });
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    verifyAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1F2937]">
        <Loader2 className="animate-spin text-white" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* ── Admin Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#1F2937] flex-col justify-between p-6 fixed inset-y-0 left-0 z-50 rounded-r-[32px] shadow-2xl hidden md:flex">
        <div>
          <div className="mb-10">
            <p className="font-black text-white text-lg tracking-tight">
              Rent<span className="text-[#0052CC]">Ease</span>
            </p>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">
              Admin Control Center
            </p>
          </div>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    isActive
                      ? "bg-[#0052CC] text-white shadow-lg shadow-blue-900/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-[#0052CC] flex items-center justify-center font-black text-white text-sm uppercase">
              {admin?.name?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{admin?.name || "Admin"}</p>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 font-bold text-sm transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
