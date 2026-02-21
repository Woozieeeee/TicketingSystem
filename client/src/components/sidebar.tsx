"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    try {
      // 1. Clear ALL storage to ensure no old "mark3" data hangs around
      localStorage.removeItem("user");
      localStorage.removeItem("user_token");

      // 2. Redirect
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getButtonStyle = (path: string) => ({
    width: "100%",
    textAlign: "left" as const,
    padding: "14px 20px",
    border: "none",
    backgroundColor: pathname === path ? "#e2e60aff" : "transparent",
    color: pathname === path ? "#16a34a" : "#ffffff", // Better contrast
    fontWeight: "bold" as const,
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "8px",
  });

  return (
    <aside
      style={{
        width: "260px",
        backgroundColor: "#16a34a",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "calc(100vh - 52px)",
        left: 0,
        top: "52px",
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: "32px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#ffffff" }}>
          {user?.dept || "System"}
          <span style={{ color: "#facc15" }}>
            {" "}
            {user?.role === "Head" ? "Head" : "User"} View
          </span>
        </h2>
      </div>

      <nav style={{ flex: 1, paddingTop: "20px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={getButtonStyle("/dashboard")}
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/tickets")}
          style={getButtonStyle("/tickets")}
        >
          Tickets
        </button>
      </nav>

      {/* User Profile Section */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {/* Avatar Circle - Shows only the First Letter */}
          <div
            style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#16a34a",
              flexShrink: 0,
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
          </div>

          {/* User Text Info - Shows the full name and role */}
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#ffffff",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.username || "Guest"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
              {user?.role || "User"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#e21212ff",
            color: "#ffffff",
            borderRadius: "4px",
            fontWeight: "900",
            fontSize: "0.8rem",
            border: "solid 2px #500101ff",
            cursor: "pointer",
          }}
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
