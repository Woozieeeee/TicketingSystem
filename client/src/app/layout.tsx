"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import "./globals.css";
import Navbar from "../components/Navbar";
// Inayos ang path base sa explorer: components/sidebar/Sidebar.tsx
import Sidebar from "../components/Sidebar"; 
// Inayos ang path base sa explorer: components/ChatHeadModal/index.tsx
import ChatHeadModal from "../components/ChatHeadModal";
import { validateToken, clearAuth } from "../lib/apiClient";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle Initial Mount and Initial User Load
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

  // Authentication Logic Wrapper
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isAuthPage) {
        try {
          const storedUser = localStorage.getItem("user");
          setUser(storedUser ? JSON.parse(storedUser) : null);
        } catch (error) {
          setUser(null);
        }
        return;
      }

      // On protected pages, validate the token
      const isValid = await validateToken();

      if (!isValid) {
        clearAuth();
        setUser(null);
        router.push("/login");
        return;
      }

      // Token is valid, reload user data from storage
      try {
        const storedUser = localStorage.getItem("user");
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch (error) {
        setUser(null);
      }
    };

    checkAuth();
  }, [pathname, mounted, router]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const noSidebarPages = ["/tickets", "/monitoring", "/chat","/userManagement"];
  const isNoSidebar = noSidebarPages.some((p) => pathname.startsWith(p));

  const showSidebar = !isAuthPage && !isNoSidebar;
  const showNavbar = !isAuthPage;
  const isMessagingPage =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/message") ||
    pathname.startsWith("/chat");

  const showChatHead = user && !isAuthPage && !isMessagingPage;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300"
        suppressHydrationWarning
      >
        {mounted && (
          <div className="flex h-screen overflow-hidden">
            {showSidebar && <Sidebar user={user} />}

            <div className="flex flex-col flex-1 w-full overflow-hidden">
              {showNavbar && <Navbar user={user} />}

              <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
                <div className="w-full h-full">{children}</div>
              </main>
            </div>

            {showChatHead && <ChatHeadModal />}
          </div>
        )}
        <div id="modal-root" />
      </body>
    </html>
  );
}