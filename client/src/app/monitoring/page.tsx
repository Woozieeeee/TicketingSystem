"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Lightweight inline icon placeholders (emoji) that respect `size` and `className` props
const makeIcon = (emoji: string) => (props: any) => {
  const { size, className, style, ...rest } = props || {};
  const fontSize = size
    ? typeof size === "number"
      ? `${size}px`
      : size
    : undefined;
  return (
    <span
      {...rest}
      className={className}
      style={{ ...(style || {}), fontSize, lineHeight: 1 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
};

const ArrowLeft = makeIcon("←");
const UserIcon = makeIcon("👤");
const Zap = makeIcon("⚡");
const CheckCircle2 = makeIcon("✅");
const Timer = makeIcon("⏱️");
const Inbox = makeIcon("📥");
const ChevronRight = makeIcon("›");
const Calendar = makeIcon("📅");
const Clock = makeIcon("🕒");
const RotateCcw = makeIcon("🔄");
const Edit3 = makeIcon("✏️");
const Search = makeIcon("🔎");
const X = makeIcon("✖️");
const TrendingUp = makeIcon("📈");

const IT_TEAM = [
  {
    id: "u1",
    name: "Alice Johnson",
    role: "Senior Lead",
    trend: [20, 45, 30, 80, 50, 90, 140],
  },
  {
    id: "u2",
    name: "Bob Smith",
    role: "Network Tech",
    trend: [10, 20, 15, 40, 30, 60, 89],
  },
  {
    id: "u3",
    name: "Charlie Davis",
    role: "Security Analyst",
    trend: [5, 15, 10, 30, 25, 40, 67],
  },
  {
    id: "u4",
    name: "Dana White",
    role: "Helpdesk",
    trend: [40, 80, 60, 120, 100, 180, 210],
  },
  {
    id: "u5",
    name: "Edward Norton",
    role: "Systems Engineer",
    trend: [15, 30, 25, 50, 45, 70, 95],
  },
  {
    id: "u6",
    name: "Fiona Gallagher",
    role: "Database Admin",
    trend: [10, 25, 20, 45, 35, 60, 82],
  },
];

const getStatsForRange = () => ({
  pending: Math.floor(Math.random() * 15 + 2),
  ongoing: Math.floor(Math.random() * 10 + 3),
  resolved: Math.floor(Math.random() * 50 + 20),
});

export default function ITDepartmentDashboard() {
  const [view, setView] = useState<"list" | "stats">("list");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("Weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStats, setCurrentStats] = useState({
    pending: 0,
    ongoing: 0,
    resolved: 0,
  });
  const [liveTime, setLiveTime] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayFormatted = new Date().toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const filteredTeam = useMemo(() => {
    return IT_TEAM.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  useEffect(() => {
    setIsMounted(true);
    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      if (!displayDate) setDisplayDate(todayFormatted);
    };
    const timerId = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timerId);
  }, [displayDate, todayFormatted]);

  useEffect(() => {
    if (selectedUser) setCurrentStats(getStatsForRange());
  }, [selectedUser, timeRange, displayDate]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          backgroundColor: "#f8fafc",
          padding: "40px",
        }}
      >
        <div
          style={{
            padding: "24px 48px",
            backgroundColor: "#FDFDFD",
            minHeight: "100vh",
            color: "#0f172a",
            fontFamily: "sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          {/* HEADER */}
          <header
            style={{
              marginBottom: "48px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {view === "stats" && (
                <button
                  onClick={() => setView("list")}
                  style={{
                    padding: "16px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    fontSize: "24px",
                  }}
                >
                  ←
                </button>
              )}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "#fbbf24",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  >
                    ⚡
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.3em",
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    Central Command
                  </span>
                </div>
                <h1
                  style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                    margin: 0,
                  }}
                >
                  IT{" "}
                  <span
                    style={{
                      color: "#16a34a",
                      textDecoration: "underline",
                      textDecorationColor: "#fbbf24",
                      textDecorationThickness: "4px",
                      textUnderlineOffset: "8px",
                    }}
                  >
                    DEPARTMENT
                  </span>
                </h1>
              </div>
            </div>

            {/* SEARCH BAR (List View) */}
            {view === "list" && (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "400px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "20px",
                    color: "#94a3b8",
                  }}
                >
                  🔎
                </span>
                <input
                  type="text"
                  placeholder="Filter personnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: "56px",
                    paddingRight: "12px",
                    padding: "20px",
                    backgroundColor: "#f8fafc",
                    border: "2px solid #e2e8f0",
                    borderRadius: "24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#16a34a";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                />
              </div>
            )}

            {/* DATE & TIME (Stats View) */}
            {view === "stats" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {displayDate !== todayFormatted && (
                    <button
                      onClick={() => setDisplayDate(todayFormatted)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "10px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)",
                      }}
                    >
                      🔄 Sync Today
                    </button>
                  )}
                  <div
                    onClick={() => dateInputRef.current?.showPicker()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      backgroundColor: "#ffffff",
                      paddingLeft: "20px",
                      paddingRight: "20px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      borderRadius: "16px",
                      border: "2px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#16a34a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <input
                      type="date"
                      ref={dateInputRef}
                      onChange={(e) =>
                        setDisplayDate(
                          new Date(e.target.value).toLocaleDateString([], {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          }),
                        )
                      }
                      style={{
                        position: "absolute",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "10px",
                        fontWeight: 900,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderRight: "1px solid #e2e8f0",
                        paddingRight: "16px",
                      }}
                    >
                      📅 <span style={{ color: "#0f172a" }}>{displayDate}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "10px",
                        fontWeight: 900,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      🕒{" "}
                      <span style={{ fontFamily: "monospace" }}>
                        {liveTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* VIEW 1: STAFF DIRECTORY WITH MINI-GRAPHS */}
          {view === "list" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "32px",
                animation: "fadeIn 0.7s ease",
              }}
            >
              {filteredTeam.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setView("stats");
                  }}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "2px solid #e2e8f0",
                    padding: "32px",
                    borderRadius: "32px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    minHeight: "320px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.boxShadow =
                      "0 20px 48px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ position: "relative", zIndex: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          borderRadius: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "32px",
                          transition: "all 0.5s",
                        }}
                      >
                        👤
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 900,
                            color: "#cbd5e1",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            margin: 0,
                          }}
                        >
                          Efficiency
                        </p>
                        <p
                          style={{
                            fontSize: "20px",
                            fontWeight: 900,
                            color: "#16a34a",
                            fontStyle: "italic",
                            margin: "4px 0 0 0",
                          }}
                        >
                          98%
                        </p>
                      </div>
                    </div>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.2,
                        margin: "0 0 12px 0",
                      }}
                    >
                      {user.name}
                    </h3>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "24px",
                      }}
                    >
                      {user.role}
                    </p>
                  </div>

                  {/* MINI GRAPH */}
                  <div
                    style={{
                      height: "80px",
                      width: "100%",
                      marginTop: "16px",
                      opacity: 0.4,
                      transition: "opacity 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.4";
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={user.trend.map((v: number, i: number) => ({
                          v,
                          i,
                        }))}
                      >
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="#16a34a"
                          fill="#f0fdf4"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 2: STATISTICS (Full Dynamic Graph) */}
          {view === "stats" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "40px",
                animation: "slideUp 0.7s ease",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "32px",
                }}
              >
                <MetricCard
                  label="Pending"
                  value={currentStats.pending}
                  icon="📥"
                  accent="zinc"
                  description={`Records for ${displayDate}`}
                />
                <MetricCard
                  label="Ongoing"
                  value={currentStats.ongoing}
                  icon="⏱️"
                  accent="amber"
                  description={`Active on ${displayDate}`}
                />
                <MetricCard
                  label="Resolved"
                  value={currentStats.resolved}
                  icon="✅"
                  accent="emerald"
                  description={`Closed on ${displayDate}`}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "32px",
                }}
              >
                <div
                  style={{
                    gridColumn: "span 1",
                    backgroundColor: "#ffffff",
                    border: "2px solid #e2e8f0",
                    padding: "40px",
                    borderRadius: "40px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "48px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "#0f172a",
                        letterSpacing: "-1px",
                        margin: 0,
                      }}
                    >
                      <span style={{ color: "#16a34a" }}>📈</span>
                      {timeRange} Analytics: {displayDate}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        backgroundColor: "#f3f4f6",
                        padding: "6px",
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {["Today", "Weekly", "Monthly"].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          style={{
                            paddingLeft: "20px",
                            paddingRight: "20px",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: 900,
                            border: "none",
                            backgroundColor:
                              timeRange === range ? "#ffffff" : "transparent",
                            color: timeRange === range ? "#0f172a" : "#94a3b8",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            transition: "all 0.2s",
                            boxShadow:
                              timeRange === range
                                ? "0 2px 8px rgba(0,0,0,0.1)"
                                : "none",
                            transform:
                              timeRange === range ? "scale(1.05)" : "scale(1)",
                          }}
                        >
                          {range.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: "400px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "BACKLOG",
                            val: currentStats.pending,
                            fill: "#cbd5e1",
                          },
                          {
                            name: "IN PROGRESS",
                            val: currentStats.ongoing,
                            fill: "#f59e0b",
                          },
                          {
                            name: "RESOLVED",
                            val: currentStats.resolved,
                            fill: "#16a34a",
                          },
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="0"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar
                          dataKey="val"
                          radius={[16, 16, 0, 0]}
                          barSize={80}
                          animationDuration={1500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#0f172a",
                    padding: "40px",
                    borderRadius: "40px",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    boxShadow: "0 20px 48px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "256px",
                      height: "256px",
                      background: "rgba(22, 163, 74, 0.1)",
                      borderRadius: "50%",
                      filter: "blur(100px)",
                      marginRight: "-128px",
                      marginTop: "-128px",
                    }}
                  ></div>
                  <div>
                    <div
                      style={{
                        display: "inline-block",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "rgba(22, 163, 74, 0.1)",
                        border: "1px solid rgba(22, 163, 74, 0.2)",
                        borderRadius: "9999px",
                        marginBottom: "32px",
                      }}
                    >
                      <span
                        style={{
                          color: "#86efac",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          fontSize: "10px",
                        }}
                      >
                        Security Verified
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        marginBottom: "40px",
                        letterSpacing: "-1px",
                        fontStyle: "italic",
                        margin: 0,
                      }}
                    >
                      Stats for{" "}
                      <span style={{ color: "#86efac" }}>
                        {selectedUser?.name || "Team"}
                      </span>
                    </p>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "14px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        lineHeight: 1.8,
                      }}
                    >
                      Automated daily backup confirmed. Performance is within
                      target margins for the selected period.
                    </p>
                  </div>
                  <button
                    style={{
                      width: "100%",
                      paddingTop: "24px",
                      paddingBottom: "24px",
                      marginTop: "40px",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      borderRadius: "16px",
                      fontWeight: 900,
                      fontSize: "12px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#16a34a";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.color = "#0f172a";
                    }}
                  >
                    Export Dataset
                  </button>
                </div>
              </div>
            </div>
          )}

          <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon, accent, description }: any) {
  const styles: any = {
    zinc: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      color: "#0f172a",
      hoverColor: "#94a3b8",
    },
    amber: {
      backgroundColor: "rgba(251, 191, 36, 0.04)",
      borderColor: "#fcd34d",
      color: "#92400e",
      hoverColor: "#f59e0b",
    },
    emerald: {
      backgroundColor: "rgba(22, 163, 74, 0.04)",
      borderColor: "#86efac",
      color: "#065f46",
      hoverColor: "#16a34a",
    },
  };

  const style = styles[accent];

  return (
    <div
      style={{
        padding: "40px",
        borderRadius: "32px",
        border: `2px solid ${style.borderColor}`,
        backgroundColor: style.backgroundColor,
        transition: "all 0.5s",
        cursor: "pointer",
        color: style.color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = style.hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = style.borderColor;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            padding: "16px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: `1px solid ${style.borderColor}`,
            color: "#0f172a",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            opacity: 0.5,
            fontStyle: "italic",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "64px",
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1,
          display: "block",
        }}
      >
        {value}
      </span>
      <p
        style={{
          marginTop: "40px",
          fontSize: "10px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          opacity: 0.3,
          fontStyle: "italic",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}
