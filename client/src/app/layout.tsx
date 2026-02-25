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
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Get user data from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-sync user whenever pathname changes
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      setUser(null);
    }
  }, [pathname]);

  // Determine layout type
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const noSidebarPages = ["/tickets/create", "/tickets/edit"];
  const isNoSidebar = noSidebarPages.some((p) => pathname.startsWith(p));
  const showSidebar = !isAuthPage && !isNoSidebar;

  return (
    <html lang="en">
      <body>
        {/* LAYOUT A: Auth Pages & Create/Edit Pages (Navbar only) */}
        {(isAuthPage || isNoSidebar) && (
          <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
            <Navbar user={user} />
            <div className="flex-1 overflow-y-auto w-full">
              <main className="p-6 w-full max-w-[1600px] mx-auto">
                {children}
              </main>
            </div>
          </div>
        )}

        {/* LAYOUT B: Dashboard Pages (Sidebar + Navbar) */}
        {showSidebar && (
          <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar user={user} />
            <div className="flex flex-col flex-1 w-full overflow-y-auto">
              <Navbar user={user} />
              <main className="p-6 w-full">{children}</main>
            </div>
          </div>
        )}

        {/* Modal root for portals */}
        <div id="modal-root" />
      </body>
    </html>
  );
}
