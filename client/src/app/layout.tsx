"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatHeadModal from "../components/chatHeadModal";
import { validateToken, clearAuth } from "../lib/apiClient";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

    const checkAuth = async () => {
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isAuthPage) {
        // On auth pages, just load user data without validation
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
        // Token is invalid, clear auth and redirect to login
        clearAuth();
        setUser(null);
        router.push("/login");
        return;
      }

      // Token is valid, load user data
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
  const noSidebarPages = ["/tickets/create", "/tickets/edit"];
  const isNoSidebar = noSidebarPages.some((p) => pathname.startsWith(p));

  // Sidebar remains hidden on auth pages
  const showSidebar = !isAuthPage && !isNoSidebar;

  const isMessagingPage =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/message") ||
    pathname.startsWith("/chat");

  // Chat head remains hidden on auth pages and messaging pages
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
              {/* 🟢 FIXED: Removed the !isAuthPage check so Navbar ALWAYS shows */}
              <Navbar user={user} />

              <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
                <div className="w-full h-full">{children}</div>
              </main>
            </div>

            {/* Render ChatHead ONLY when showChatHead is true */}
            {showChatHead && <ChatHeadModal />}
          </div>
        )}
        <div id="modal-root" />
      </body>
    </html>
  );
}
