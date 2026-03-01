"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
// 🟢 IMPORT THE CHAT HEAD COMPONENT
import ChatHeadModal from "../components/chatHeadModal";

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

  // 🟢 FIXED: Expanded the check to catch singular/plural or different route names
  // If your actual URL is different (e.g., "/admin/messages"), add it to this list!
  const isMessagingPage =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/message") ||
    pathname.startsWith("/chat");

  // Only show the chat head if logged in, NOT on auth pages, and NOT on the messages page
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
              {!isAuthPage && <Navbar user={user} />}

              <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
                <div className="w-full h-full">{children}</div>
              </main>
            </div>

            {/* 🟢 Render ChatHead ONLY when showChatHead is true */}
            {showChatHead && <ChatHeadModal />}
          </div>
        )}
        <div id="modal-root" />
      </body>
    </html>
  );
}
