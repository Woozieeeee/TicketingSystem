"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { Bell } from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    role: string;
    dept: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false); // To prevent hydration errors
  const notificationRef = useRef<HTMLDivElement>(null);

  // 1. Set mounted state to true on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Fetch Notifications logic
  const fetchNotifications = async () => {
    if (!user?.username) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/notifications/${encodeURIComponent(user.username)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.username]);

  // 4. Handle Mark as Read and Navigate
  const handleNotificationClick = async (
    notifId: string,
    ticketGlobalId: string,
  ) => {
    try {
      setNotificationOpen(false);

      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n)),
      );

      await fetch(`http://localhost:3001/api/notifications/${notifId}/read`, {
        method: "PATCH",
      });

      router.push(`/tickets?highlight=${ticketGlobalId}`);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // 5. Calculate unread count (supports Boolean or 1/0 from MySQL)
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.is_read === false || n.is_read === 0)
      .length;
  }, [notifications]);

  return (
    <nav
      className="sticky top-0 z-[999] text-white shadow-md border-b border-green-600 px-6 py-4 flex justify-between items-center"
      style={{ backgroundColor: "#15803d" }}
    >
      <div className="flex items-center">
        <h1
          className="text-lg font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/dashboard")}
        >
          Ticketing System
        </h1>
      </div>

      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          // Added relative and overflow-visible to ensure the badge isn't clipped
          className="relative p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none overflow-visible group"
          title="Notifications"
        >
          <Bell
            size={22}
            className="text-white transition-transform duration-300 group-hover:rotate-[12deg]"
            strokeWidth={2}
          />

          {/* THE MODERN RED BADGE */}
          {mounted && unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 flex items-center justify-center rounded-full text-[10px] font-black text-white ring-2 ring-[#15803d] shadow-lg animate-pulse-wiggle"
              style={{
                width: "18px",
                height: "18px",
                padding: "0",
                zIndex: 50,
                backgroundColor: "#dc2626",
                // Base transform matches the NEW keyframes to prevent "jumping"
                transform: "translate(15%, -15%)",
                pointerEvents: "none",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {/* NOTIFICATION DROPDOWN */}
        {mounted && notificationOpen && (
          <div
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl border border-slate-100 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200"
            style={{ zIndex: 1000, top: "100%" }}
          >
            {/* HEADER */}
            <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100 bg-white">
              <h3 className="text-base font-bold text-slate-800 text-black tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            {/* NOTIFICATIONS LIST */}
            <ul className="max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const isUnread = !n.is_read || n.is_read === 0;
                  return (
                    <li
                      key={n.id}
                      className={`group relative px-5 py-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-4 items-start ${
                        isUnread ? "bg-slate-50/40" : "bg-white"
                      }`}
                      onClick={() =>
                        handleNotificationClick(n.id, n.ticketGlobalId)
                      }
                    >
                      {/* Status Indicator Dot (Left side anchor) */}
                      <div className="mt-1.5 flex-shrink-0">
                        {isUnread ? (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        ) : (
                          <div className="w-2.5 h-2.5 border-2 border-slate-200 rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <p
                          className={`text-sm leading-relaxed ${
                            isUnread
                              ? "font-semibold text-slate-900"
                              : "font-medium text-slate-600"
                          }`}
                        >
                          {n.message}
                        </p>

                        {/* Timestamp */}
                        <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                          {new Date(n.created_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}{" "}
                          at{" "}
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="py-12 px-4 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                    <Bell size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">
                    You're all caught up
                  </p>
                  <p className="text-slate-400 text-xs">
                    No new notifications at the moment.
                  </p>
                </li>
              )}
            </ul>

            {/* FOOTER */}
            <div
              className="p-4 text-center border-t border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => router.push("/notifications")} // Adjust this link to your full notifications page if you have one
            >
              <button className="text-xs text-blue-600 font-bold tracking-wider uppercase">
                View All Activity
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
