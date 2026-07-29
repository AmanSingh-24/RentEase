"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, CheckCheck, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "./ToastContext";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  host_approved: "🎉",
  host_rejected: "❌",
  property_approved: "🏠",
  property_rejected: "📋",
  application_preapproved: "✅",
  application_approved: "🎊",
  application_rejected: "🚫",
  general: "📣",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track which IDs were already seen to fire toast only for genuinely new ones
  const seenIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();

      const incoming: Notification[] = data.notifications || [];
      const newOnes = incoming.filter(
        (n) => !n.isRead && !seenIds.current.has(n._id)
      );

      // On first fetch, seed the seenIds so we don't spam toast for old notifications
      if (isFirstFetch.current) {
        incoming.forEach((n) => seenIds.current.add(n._id));
        isFirstFetch.current = false;
      } else {
        // Fire a toast for each genuinely new notification
        newOnes.forEach((n) => {
          showToast(n.title, n.type === "host_rejected" || n.type === "property_rejected" ? "error" : "success", 6000);
          seenIds.current.add(n._id);
        });
      }

      setNotifications(incoming);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silently ignore */ }
  }, [userId, showToast]);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", { method: "POST", body: "{}" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-[#0052CC]" />
        ) : (
          <Bell size={18} className="text-gray-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md shadow-red-200 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[#0052CC]" />
                <span className="font-black text-sm text-[#1F2937]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#0052CC] hover:text-[#0041a3] transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Bell size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`group relative px-4 py-3.5 border-b border-gray-50 last:border-b-0 transition-all cursor-pointer hover:bg-gray-50/70 ${
                      !n.isRead ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => { if (!n.isRead) markOneRead(n._id); }}
                  >
                    {/* Unread dot */}
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#0052CC] rounded-full" />
                    )}
                    <div className="flex gap-3 pl-2">
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {TYPE_EMOJI[n.type] || "📣"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug mb-0.5 ${!n.isRead ? "font-bold text-[#1F2937]" : "font-medium text-gray-600"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-300 font-medium">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.actionUrl && (
                            <Link
                              href={n.actionUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[10px] font-bold text-[#0052CC] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              View <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
