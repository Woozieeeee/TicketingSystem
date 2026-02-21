"use client"; // Add this since we are using state/localstorage

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Get user data from localStorage so the Sidebar/Navbar can see it
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Re-sync user whenever pathname changes (e.g., after login redirect or logout)
  // This ensures Sidebar always shows the current logged-in user, not stale data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  // Pages that should show only the Navbar (no Sidebar)
  const noSidebarPages = ["/tickets/create", "/tickets/edit"];
  const isNoSidebar = noSidebarPages.some((p) => pathname.startsWith(p));

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {/* Use the layout type as a KEY to force a clean re-render when switching */}
        <div key={isAuthPage || isNoSidebar ? "minimal" : "full"}>
          {isAuthPage || isNoSidebar ? (
            // VIEW A: Minimal (Navbar Only)
            <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
              <Navbar user={user} />
              {/* Use a wrapper div here to match the Dashboard's nested structure */}
              <div className="flex-1 flex flex-col overflow-y-auto w-full">
                <main className="p-6 w-full max-w-[1600px] mx-auto">
                  {children}
                </main>
              </div>
            </div>
          ) : (
            // VIEW B: Full Dashboard (Sidebar + Navbar)
            <div className="flex h-screen overflow-hidden bg-gray-50">
              <Sidebar user={user} />
              <div className="flex flex-col flex-1 w-full overflow-y-auto">
                <Navbar user={user} />
                <main className="p-6 w-full">{children}</main>
              </div>
            </div>
          )}
        </div>

        <div id="modal-root"></div>
      </body>
    </html>
  );
}
