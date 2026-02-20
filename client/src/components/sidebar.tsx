import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { text } from "stream/consumers";

export default function Sidebar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();

  // The missing Logout Logic
  const handleLogout = async () => {
    try {
      // 1. If you use an API route for logout:
      // await fetch('/api/auth/logout', { method: 'POST' });

      // 2. Clear local storage/session (if applicable)
      localStorage.removeItem("user_token");

      // 3. Redirect to login page
      router.push("/login");
      router.refresh(); // Clears any cached server data
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
    color: pathname === path ? "#2563eb" : "#4b5563",
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
        height: "calc(100vh - 60px)", // Subtract navbar height
        left: 0,
        top: "60px", // Push it down past the navbar
        zIndex: "10 !important",
      }}
    >
      <div style={{ padding: "32px 24px", borderBottom: "1px solid #f3f4f6" }}>
        <h2
          style={{ fontSize: "1.3rem", fontWeight: "900", color: "#dadadaff" }}
        >
          {user?.dept}
          <span style={{ color: "#ffffff" }}> User View</span>
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ ...getButtonStyle("/dashboard"), color: "#ffffff" }}
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/tickets")}
          style={{ ...getButtonStyle("/tickets"), color: "#ffffff" }}
        >
          Tickets
        </button>
      </nav>

      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #f3f4f6",
          backgroundColor: "#16a34a",
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
              border: "2px solid #ffffff",
              overflow: "hidden", // Ensures image stays circular
              flexShrink: 0,
            }}
          >
            {/* User Text Info */}
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#ffffff", // Changed to white for better contrast on green
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.username || "Guest"}
              </p>
            </div>
          </div>
          <div style={{ paddingLeft: "8px" }}>
            {/* Username */}
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#ffffff", // Changed to white for better contrast on green
                textTransform: "capitalize",
                marginBottom: "2px", // Small margin to keep them close
              }}
            >
              {user?.username}
            </p>

            {/* Role */}
            <p
              style={{
                fontSize: "0.75rem", // Made slightly smaller for better hierarchy
                fontWeight: "500", // Less bold than the name
                color: "rgba(255,255,255,0.8)", // Faded white look
                textTransform: "capitalize",
                marginBottom: "8px", // Keep the 8px here to push the logout button down
              }}
            >
              {user?.role}
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
