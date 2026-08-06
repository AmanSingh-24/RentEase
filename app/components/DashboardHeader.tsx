import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";

interface DashboardHeaderProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  collapsed?: boolean;
  onOpenSidebar?: () => void;
}

export default function DashboardHeader({
  user,
  collapsed = false,
  onOpenSidebar,
}: DashboardHeaderProps) {
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(" ").filter(Boolean);
      const init = parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
      setInitials(init || "U");
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 px-6 py-3 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* Left: RentEase Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="relative w-[150px] h-[40px]">
          <Image
            src="/desk3.png"
            alt="RentEase Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </Link>

      {/* Right: Notifications, Profile Pill, Sign-Out & Hamburger Menu when collapsed */}
      <div className="flex items-center gap-3.5">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Avatar Pill */}
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/90 rounded-full pl-2 pr-6 py-1.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-neutral-950 text-white font-bold text-xs flex items-center justify-center border border-neutral-800 shrink-0">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-extrabold text-neutral-900 max-w-[160px] truncate leading-snug">
              {user?.name || "User Account"}
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold tracking-wide capitalize">
              {user?.role || "Active Session"}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-full transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          title="Sign Out to Landing Page"
        >
          <LogOut size={15} />
          <span className="hidden md:inline font-bold">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
