"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Ticket,
  Activity,
  LogOut,
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

  // 🟢 NEW: Update the global CSS variable for the dashboard margin!
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "80px" : "256px", // 80px = w-20, 256px = w-64
    );
  }, [isCollapsed]);

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
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Tickets", path: "/tickets", icon: <Ticket size={20} /> },
    ...(user?.role === "Head"
      ? [
          {
            name: "Monitoring",
            path: "/monitoring",
            icon: <Activity size={20} />,
          },
        ]
      : []),
  ];

  if (!isMounted) return null;

  return (
    <>
      {/* 📱 MOBILE HAMBURGER BUTTON */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed z-20 p-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"
        style={{ top: "65px", left: "16px" }}
      >
        <Menu size={24} />
      </button>

      {/* 📱 MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity backdrop-blur-sm"
          style={{ top: "50px" }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 💻 THE SIDEBAR */}
      <aside
        className={`fixed bg-green-600 text-white border-r border-green-700 flex flex-col z-40 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ top: "50px", height: "calc(100vh - 50px)" }}
      >
        {/* 💻 FLOATING COLLAPSE ARROW */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3.5 top-6 w-7 h-7 bg-white text-green-700 border-2 border-slate-100 rounded-full items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all z-50 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={3} />
          ) : (
            <ChevronLeft size={16} strokeWidth={3} />
          )}
        </button>

        {/* ── HEADER ── */}
        <div
          className={`py-8 ${isCollapsed ? "px-2 text-center" : "px-6"} border-b border-white/20 transition-all duration-300`}
        >
          {isCollapsed ? (
            <h2 className="text-xl font-black text-yellow-400 select-none">
              {user?.role === "Head" ? "H" : "U"}
            </h2>
          ) : (
            <h2 className="text-xl font-black tracking-tight whitespace-nowrap overflow-hidden select-none">
              {user?.dept || "System"}
              <span className="text-yellow-400 ml-1.5">
                {user?.role === "Head" ? "Head" : "User"}
              </span>
            </h2>
          )}
        </div>

        {/* ── NAVIGATION LIST ── */}
        <nav className="flex-1 pt-5 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setIsMobileOpen(false);
                }}
                className={`flex items-center gap-3.5 w-full px-3 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-yellow-400 text-green-800 shadow-md transform scale-[1.02]"
                    : "text-white hover:bg-white/10"
                } ${isCollapsed ? "justify-center" : "justify-start"}`}
                title={isCollapsed ? item.name : ""}
              >
                <span className={isActive ? "text-green-800" : "text-white"}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── PROFILE SECTION ── */}
        <div className="p-4 border-t border-white/20 bg-green-700/30">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} mb-4 transition-all duration-300`}
          >
            <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center text-lg font-black flex-shrink-0 shadow-inner">
              {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white capitalize truncate">
                  {user?.username || "Guest"}
                </p>
                <p className="text-xs text-white/80">{user?.role || "User"}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-sm border-2 border-red-800 transition-colors shadow-sm active:scale-95 ${
              isCollapsed ? "px-0" : "px-4"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={isCollapsed ? 18 : 16} strokeWidth={2.5} />
            {!isCollapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
