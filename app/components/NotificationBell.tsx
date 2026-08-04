"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellRing, CheckCheck, X, ExternalLink,
  CheckCircle, XCircle, Home, Megaphone, FileText
} from "lucide-react";
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

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "host_approved":
    case "application_approved":
    case "application_preapproved":
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
          <CheckCircle size={16} />
        </div>
      );
    case "host_rejected":
    case "property_rejected":
    case "application_rejected":
      return (
        <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0">
          <XCircle size={16} />
        </div>
      );
    case "property_approved":
      return (
        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 flex-shrink-0">
          <Home size={16} />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 flex-shrink-0">
          <Megaphone size={16} />
        </div>
      );
  }
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);
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

      if (isFirstFetch.current) {
        incoming.forEach((n) => seenIds.current.add(n._id));
        isFirstFetch.current = false;
      } else {
        newOnes.forEach((n) => {
          showToast(
            n.title,
            n.type === "host_rejected" || n.type === "property_rejected" ? "error" : "success",
            6000
          );
          seenIds.current.add(n._id);
        });
      }

      setNotifications(incoming);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silently ignore */ }
  }, [userId, showToast]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-all text-neutral-800"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-neutral-900" />
        ) : (
          <Bell size={18} className="text-neutral-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-neutral-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
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
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden z-50 text-neutral-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-neutral-900" />
                <span className="font-extrabold text-sm text-neutral-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:underline transition-all"
                >
                  <CheckCheck size={13} /> Mark read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <Bell size={28} className="text-neutral-300" />
                  <p className="text-xs text-neutral-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`group relative px-4 py-3.5 border-b border-neutral-100 last:border-b-0 transition-all cursor-pointer hover:bg-neutral-50/80 ${
                      !n.isRead ? "bg-neutral-50/40" : ""
                    }`}
                    onClick={() => { if (!n.isRead) markOneRead(n._id); }}
                  >
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                    )}
                    <div className="flex gap-3 pl-2 items-start">
                      <NotificationIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug mb-0.5 ${!n.isRead ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-neutral-400 font-semibold">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.actionUrl && (
                            <Link
                              href={n.actionUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[11px] font-bold text-neutral-900 underline hover:text-neutral-600 transition-colors"
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
