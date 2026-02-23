"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRelativeTime } from "../../lib/utils";

export default function RoleBasedDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState("just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);

    try {
      const params = new URLSearchParams();
      if (parsedUser?.role) params.set("role", parsedUser.role);
      if (parsedUser?.dept) params.set("dept", parsedUser.dept);
      if (parsedUser?.id) params.set("userId", parsedUser.id);

      const res = await fetch(
        `http://localhost:3001/api/tickets?${params.toString()}`,
      );
      if (res.ok) {
        const allTickets = await res.json();
        const transformed = allTickets.map((t: any) => ({
          ...t,
          status:
            t.status === "PENDING"
              ? "Pending"
              : t.status === "IN_PROGRESS"
                ? "In Progress"
                : t.status === "RESOLVED"
                  ? "Resolved"
                  : t.status,
        }));
        setTickets(transformed);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor(
        (new Date().getTime() - lastUpdated.getTime()) / 1000,
      );
      if (seconds < 60) setTimeAgo("just now");
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    loadTickets();
  }, [router, loadTickets]);

  useEffect(() => {
    window.addEventListener("focus", loadTickets);
    return () => window.removeEventListener("focus", loadTickets);
  }, [loadTickets]);

  const pendingCount = tickets.filter((t) => t.status === "Pending").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "In Progress",
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  console.log("DEBUG - Counts:", {
    pendingCount,
    inProgressCount,
    resolvedCount,
    totalTickets: tickets.length,
  });

  const latestTicket = [...tickets].sort((a, b) => {
    const timeB = new Date(b.lastUpdated || b.date).getTime();
    const timeA = new Date(a.lastUpdated || a.date).getTime();
    return timeB - timeA;
  })[0];

  const displayDate = latestTicket
    ? latestTicket.lastUpdated || latestTicket.date
    : new Date().toISOString();

  const deptAccent =
    user?.dept === "Nursing"
      ? { color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" }
      : user?.dept === "IT"
        ? {
            color: "#16a34a",
            bg: "#f0fdf4",
            border: "#86efac",
            text: "#15803d",
          }
        : {
            color: "#16a34a",
            bg: "#f0fdf4",
            border: "#86efac",
            text: "#15803d",
          };

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#fafbfc",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid #e8eef5",
              borderTopColor: deptAccent.color,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 500,
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Loading dashboard…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const totalTickets = pendingCount + inProgressCount + resolvedCount;
  const resolvedPct =
    totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e8eef5;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card:hover {
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border-radius: 14px;
          border: 1px solid #e8eef5;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
        }
        .stat-card:hover {
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
          border-color: #d8dfe8;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 12px;
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
          white-space: nowrap;
          color: #ffffff;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1px solid #e8eef5;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .btn-icon:hover {
          border-color: #d8dfe8;
          color: #334155;
          background: #fafbfc;
        }

        .label-small {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .label-value {
          font-size: 14px;
          font-weight: 500;
          color: #334155;
        }

        .divider {
          height: 1px;
          background: #f5f6f9;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .spin {
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-bar {
          height: 5px;
          border-radius: 999px;
          background: #e8eef5;
          overflow: hidden;
          margin-top: 12px;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .fade-in {
          animation: fadeIn 0.4s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulsing 2.4s ease-in-out infinite;
        }
        @keyframes pulsing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .stat-number {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 28px;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .subtext {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0;
          font-weight: 400;
        }
      `}</style>

      <main
        style={{
          marginLeft: "260px",
          backgroundColor: "#fafbfc",
          padding: "32px 32px",
          fontFamily: "'DM Sans', sans-serif",
          minHeight: "100vh",
        }}
      >
        {/* ── HEADER ── */}
        <div className="fade-in" style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: deptAccent.bg,
                  color: deptAccent.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "18px",
                  border: `1.5px solid ${deptAccent.border}`,
                  flexShrink: 0,
                }}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="header-title">
                  {user.dept}{" "}
                  <span style={{ color: deptAccent.color }}>{user.role}</span>
                </h1>
                <p className="subtext">
                  Last activity {getRelativeTime(displayDate)}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                className="btn-icon"
                onClick={handleRefresh}
                title="Refresh dashboard"
              >
                <svg
                  className={isRefreshing ? "spin" : ""}
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {user.role === "User" ? (
                <button
                  className="btn-primary"
                  onClick={() => router.push("/tickets/create")}
                  style={{ background: deptAccent.color }}
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  New Ticket
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => router.push("/tickets")}
                  style={{ background: deptAccent.color }}
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Manage Queue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          {/* Pending Card */}
          <div className="stat-card fade-in" style={{ animationDelay: "0.1s" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "#f59e0b",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <p className="stat-number">{pendingCount}</p>
            <p className="label-small" style={{ margin: "8px 0 4px" }}>
              Pending
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 14px",
                fontWeight: 400,
              }}
            >
              Awaiting response
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: totalTickets
                    ? `${(pendingCount / totalTickets) * 100}%`
                    : "0%",
                  background: "#f59e0b",
                }}
              />
            </div>
          </div>

          {/* In Progress Card */}
          <div
            className="stat-card fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "#6366f1",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="stat-number">{inProgressCount}</p>
            <p className="label-small" style={{ margin: "8px 0 4px" }}>
              In Progress
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 14px",
                fontWeight: 400,
              }}
            >
              Currently working
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: totalTickets
                    ? `${(inProgressCount / totalTickets) * 100}%`
                    : "0%",
                  background: "#6366f1",
                }}
              />
            </div>
          </div>

          {/* Resolved Card */}
          <div className="stat-card fade-in" style={{ animationDelay: "0.2s" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "#16a34a",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(22, 163, 74, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="stat-number">{resolvedCount}</p>
            <p className="label-small" style={{ margin: "8px 0 4px" }}>
              Resolved
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 14px",
                fontWeight: 400,
              }}
            >
              Completed tasks
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: totalTickets
                    ? `${(resolvedCount / totalTickets) * 100}%`
                    : "0%",
                  background: "#16a34a",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── PROFILE & RESOLUTION RATE ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "18px",
          }}
        >
          {/* Profile Card */}
          <div
            className="card fade-in"
            style={{ padding: "24px", animationDelay: "0.25s" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: deptAccent.bg,
                  color: deptAccent.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "16px",
                  border: `1.5px solid ${deptAccent.border}`,
                  flexShrink: 0,
                }}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#0f172a",
                    margin: "0 0 4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.username}
                </p>
                <span
                  className="badge"
                  style={{ background: deptAccent.bg, color: deptAccent.text }}
                >
                  {user.dept}
                </span>
              </div>
            </div>

            <div className="divider" style={{ marginBottom: "10px" }} />

            {[
              { label: "Role", value: user.role },
              { label: "Department", value: user.dept },
              { label: "Access Level", value: user.role },
            ].map(({ label, value }, i, arr) => (
              <div key={label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                  }}
                >
                  <span className="label-small">{label}</span>
                  <span className="label-value">{value}</span>
                </div>
                {i < arr.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>

          {/* Resolution Rate Card */}
          <div
            className="card fade-in"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              animationDelay: "0.3s",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <div
                  className="pulse"
                  style={{
                    background: deptAccent.color,
                    boxShadow: `0 0 0 3px ${deptAccent.bg}`,
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Filtered results for the{" "}
                  <strong
                    style={{
                      color: deptAccent.color,
                      fontWeight: 700,
                    }}
                  >
                    {user.dept}
                  </strong>{" "}
                  department
                </span>
              </div>
              <div>
                <p className="label-small" style={{ margin: "0 0 6px" }}>
                  Resolution Rate
                </p>
                <p
                  className="stat-number"
                  style={{ fontSize: "42px", margin: 0, fontWeight: 700 }}
                >
                  {resolvedPct}%
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: "120px",
                height: "120px",
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 36 36"
                width="120"
                height="120"
                style={{ transform: "rotate(-90deg)", display: "block" }}
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#e8eef5"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={deptAccent.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${resolvedPct * 0.996} 100`}
                  style={{ transition: "stroke-dasharray 0.9s ease" }}
                />
              </svg>
              <span
                style={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: deptAccent.color,
                }}
              >
                {resolvedPct}%
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
