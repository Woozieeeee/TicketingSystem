"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_URL } from "../config/api";
import {
  Menu,
  X, // 🟢 Added X icon for closing state
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Ticket,
  Activity,
  LogOut,
  MessageSquare,
} from "lucide-react";

export default function Sidebar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "88px" : "280px",
    );
  }, [isCollapsed]);

  const [chatStats, setChatStats] = useState({ unread: 0, hasReminder: false });

  useEffect(() => {
    if (!user || !isMounted) return;

    const fetchStats = async () => {
      try {
        const queryParams =
          user.role === "Head"
            ? `role=Head&dept=${user.dept}`
            : `role=User&username=${user.username}`;
        const res = await fetch(`${API_URL}/api/tickets?${queryParams}`);
        if (res.ok) {
          const tickets = await res.json();
          let unreadCount = 0;
          let reminderActive = false;

          tickets.forEach((t: any) => {
            unreadCount += t.unreadCount || 0;
            if (t.reminder_flag === 1 && t.status !== "FINISHED")
              reminderActive = true;
          });
          setChatStats({ unread: unreadCount, hasReminder: reminderActive });
        }
      } catch (err) {
        /* Silently fail on network disconnect */
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [user, isMounted]);

  const handleLogout = () => {
    try {
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} className="lg:w-[22px] lg:h-[22px]" />,
    },
    {
      name: "Tickets",
      path: "/tickets",
      icon: <Ticket size={20} className="lg:w-[22px] lg:h-[22px]" />,
    },
    {
      name: "Messages",
      path: user?.role === "Head" ? "/chat/adminChat" : "/chat/userChat",
      icon: (
        <div className="relative">
          <MessageSquare size={20} className="lg:w-[22px] lg:h-[22px]" />
          {chatStats.unread > 0 && (
            <span
              className={`absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-[#15803d] shadow-lg ${
                chatStats.hasReminder ? "animate-bounce" : ""
              }`}
            >
              {chatStats.unread > 9 ? "9+" : chatStats.unread}
            </span>
          )}
        </div>
      ),
    },
    ...(user?.role === "Head"
      ? [
          {
            name: "Monitoring",
            path: "/monitoring",
            icon: <Activity size={20} className="lg:w-[22px] lg:h-[22px]" />,
          },
        ]
      : []),
  ];

  if (!isMounted) return null;

  return (
    <>
      {/* 📱 MOBILE HAMBURGER BUTTON - 🟢 FIXED: Now toggles and changes icon */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed z-[900] p-3 bg-[#15803d] text-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:bg-green-700 transition-transform active:scale-95 bottom-[140px] right-4"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🟢 INVISIBLE BACKDROP */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-transparent"
          style={{ top: "56px" }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 💻 THE SIDEBAR - Maintained your exact alignments */}
      <aside
        className={`
    fixed bg-[#15803d] text-white border-r border-green-800 flex flex-col z-40 transition-all duration-300 ease-in-out

    /* 2. MOBILE VIEW (Phones & Tablets) */
    top-[38px] 
    h-[calc(100dvh-38px)] 
    shadow-2xl 
    w-[65vw] max-w-[280px]
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}

    /* 3. DESKTOP VIEW (Large screens, overriding mobile) */
    lg:top-[62px] 
    lg:h-[calc(100vh-62px)] 
    lg:shadow-none 
    lg:translate-x-0
    ${isCollapsed ? "lg:w-[88px]" : "lg:w-[280px]"}
  `}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-4 top-10 w-8 h-8 bg-white text-green-700 border border-green-700 rounded-full items-center justify-center shadow-lg hover:bg-slate-50 hover:scale-105 transition-all z-50 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={18} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={18} strokeWidth={2.5} />
          )}
        </button>

        {/* ── PROFILE HEADER ── */}
        <div
          className={`relative pt-8 lg:pt-10 pb-6 lg:pb-8 ${
            isCollapsed ? "px-3" : "px-5 lg:px-8"
          } bg-gradient-to-b from-black/10 to-transparent border-b border-white-300 transition-all duration-300`}
        >
          <div
            className={`flex ${
              isCollapsed
                ? "flex-col items-center"
                : "items-center gap-3 lg:gap-4"
            }`}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`rounded-2xl bg-white text-[#15803d] flex items-center justify-center font-black shadow-xl ring-4 ring-white/20 transition-all duration-300 ${
                  isCollapsed
                    ? "w-12 h-12 text-xl"
                    : "w-10 h-10 lg:w-14 lg:h-14 text-xl lg:text-2xl"
                }`}
              >
                {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 bg-emerald-400 border-[3px] border-[#15803d] rounded-full shadow-sm"></div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-base lg:text-lg font-black text-white truncate leading-tight tracking-tight">
                  {user?.username || "Guest Account"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-green-950 px-2 py-0.5 rounded shadow-sm">
                    {user?.role || "User"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-green-100/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-[10px] lg:text-[11px] font-semibold tracking-wide truncate">
                    Active • {user?.dept || "System"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── NAVIGATION LIST ── */}
        <nav className="flex-1 overflow-y-auto pt-6 lg:pt-8 px-3 lg:px-4 pb-6 flex flex-col gap-1.5 lg:gap-2">
          {!isCollapsed && (
            <p className="px-3 text-[9px] lg:text-[10px] font-bold text-green-200/60 uppercase tracking-widest mb-1 lg:mb-2 select-none">
              Main Navigation
            </p>
          )}

          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setIsMobileOpen(false);
                }}
                className={`group flex items-center gap-3 lg:gap-4 w-full px-3 lg:px-4 py-2.5 lg:py-3.5 rounded-xl font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-yellow-400 text-green-950 shadow-[0_4px_20px_-4px_rgba(250,204,21,0.4)] transform scale-[1.02]"
                    : "text-green-50 hover:bg-white/10 hover:text-white"
                } ${isCollapsed ? "justify-center" : "justify-start"}`}
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive
                      ? "text-green-800"
                      : "text-green-200 group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="whitespace-nowrap tracking-wide text-sm lg:text-[15px]">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── LOGOUT BUTTON ── */}
        <div className="p-4 lg:p-6 border-t border-white-300 bg-black/5">
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 w-full py-2.5 lg:py-3.5 bg-red-500/90 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-md border border-red-400/50 hover:shadow-[0_4px_15px_-3px_rgba(239,68,68,0.4)] transition-all active:scale-95 ${
              isCollapsed ? "px-0" : "px-3 lg:px-4"
            }`}
          >
            <LogOut size={isCollapsed ? 20 : 18} strokeWidth={2.5} />
            {!isCollapsed && (
              <span className="tracking-widest uppercase text-[10px] lg:text-[11px]">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
