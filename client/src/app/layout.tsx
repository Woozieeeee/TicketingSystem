"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      setUser(null);
    }
  }, [pathname, mounted]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const noSidebarPages = ["/tickets/create", "/tickets/edit"];
  const isNoSidebar = noSidebarPages.some((p) => pathname.startsWith(p));
  const showSidebar = !isAuthPage && !isNoSidebar;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300"
        suppressHydrationWarning
      >
        {mounted && (
          <>
            {(isAuthPage || isNoSidebar) && (
              <div className="flex h-screen flex-col overflow-hidden">
                <Navbar user={user} />
                <div className="flex-1 overflow-y-auto w-full">
                  {/* 🟢 FIXED: p-0 on mobile */}
                  <main className="p-0 sm:p-6 w-full max-w-[1600px] mx-auto overflow-x-hidden">
                    {children}
                  </main>
                </div>
              </div>
            )}

            {showSidebar && (
              <div className="flex h-screen overflow-hidden">
                <Sidebar user={user} />
                <div className="flex flex-col flex-1 w-full overflow-y-auto">
                  <Navbar user={user} />
                  {/* 🟢 FIXED: Changed p-3 to p-0 to remove the green gap in your screenshot */}
                  <main className="p-0 sm:p-6 w-full overflow-x-hidden">
                    {children}
                  </main>
                </div>
              </div>
            )}

            <div id="modal-root" />
          </>
        )}
      </body>
    </html>
  );
}
