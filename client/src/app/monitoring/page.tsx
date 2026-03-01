"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  Clock,
  ShieldCheck,
  Download,
  RotateCcw,
  Search,
} from "lucide-react";

// --- Types ---
interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
}

const IT_TEAM: TeamMember[] = [
  {
    id: "u1",
    name: "Kim De Vera",
    role: "Senior Lead",
    trend: [20, 45, 30, 80, 50, 90, 140],
    color: "#10b981",
  },
  {
    id: "u2",
    name: "Deanbry",
    role: "Network Tech",
    trend: [10, 20, 15, 40, 30, 60, 89],
    color: "#3b82f6",
  },
  {
    id: "u3",
    name: "Sam White",
    role: "Security Analyst",
    trend: [5, 15, 10, 30, 25, 40, 67],
    color: "#f59e0b",
  },
  {
    id: "u4",
    name: "SAMSAM",
    role: "Helpdesk",
    trend: [40, 80, 60, 120, 100, 180, 210],
    color: "#8b5cf6",
  },
  {
    id: "u5",
    name: "Nevaeh Christine Rose",
    role: "Systems Engineer",
    trend: [15, 30, 25, 50, 45, 70, 95],
    color: "#ec4899",
  },
  {
    id: "u6",
    name: "John Christian Alcantara",
    role: "Database Admin",
    trend: [10, 25, 20, 45, 35, 60, 82],
    color: "#06b6d4",
  },
];

const getStatsForRange = () => ({
  pending: Math.floor(Math.random() * 15 + 2),
  ongoing: Math.floor(Math.random() * 10 + 3),
  resolved: Math.floor(Math.random() * 50 + 20),
});

export default function ITHeadViewDashboard() {
  const [view, setView] = useState<"list" | "stats">("list");
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [timeRange, setTimeRange] = useState("Today");
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

  // Handle Clock and Initial Date
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

  // Update stats dynamically when range or user changes
  useEffect(() => {
    if (selectedUser) setCurrentStats(getStatsForRange());
  }, [selectedUser, timeRange, displayDate]);

  const filteredTeam = useMemo(() => {
    return IT_TEAM.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  if (!isMounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* 🟢 RESPONSIVE MAIN MARGIN */}
      <main className="responsive-main transition-all duration-300 ease-in-out bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen font-sans">
        {/* HEADER SECTION */}
        <header className="mb-6 sm:mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            {/* LEFT SIDE - TITLE & BACK BUTTON */}
            <div className="flex items-center gap-3 sm:gap-4">
              {view === "stats" && (
                <button
                  onClick={() => setView("list")}
                  className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {view === "list" ? "Monitoring" : "Performance"}
              </h1>
            </div>

            {/* RIGHT SIDE - SEARCH & DATE */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* SEARCH BAR */}
              {view === "list" && (
                <div className="relative flex-1 w-full sm:min-w-[280px] lg:min-w-[320px]">
                  <Search
                    className="search-icon-animated absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search personnel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg outline-none transition-all font-semibold text-sm shadow-sm"
                  />
                </div>
              )}

              {/* DATE & TIME SECTION */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {displayDate !== todayFormatted && (
                  <button
                    onClick={() => setDisplayDate(todayFormatted)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all whitespace-nowrap active:scale-95"
                  >
                    <RotateCcw size={12} /> Sync
                  </button>
                )}

                <div className="relative flex-shrink-0">
                  <div
                    onClick={() => dateInputRef.current?.click()}
                    className="flex items-center bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm cursor-pointer hover:border-emerald-500 transition-colors whitespace-nowrap"
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
                      className="hidden"
                    />
                    <div className="px-2 sm:px-3 border-r border-slate-100 flex items-center gap-1.5 sm:gap-2">
                      <Clock size={14} className="text-emerald-500" />
                      <span className="font-mono font-bold text-[10px] sm:text-xs tabular-nums">
                        {liveTime}
                      </span>
                    </div>
                    <div className="px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2">
                      <Calendar size={14} className="text-emerald-500" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                        {displayDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* VIEW 1: PERSONNEL DIRECTORY */}
        {view === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slideUp">
            {filteredTeam.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setView("stats");
                }}
                className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex justify-between mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <UserIcon size={24} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-full self-start">
                    Online
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">
                  {user.name}
                </h3>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest truncate">
                  {user.role}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: STATISTICS & ANALYTICS */}
        {view === "stats" && selectedUser && (
          <div className="space-y-6 sm:space-y-8 animate-slideUp">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <MetricCard
                label="Pending"
                value={currentStats.pending}
                sub="Backlog"
                color="text-slate-500"
                border="border-slate-200"
              />
              <MetricCard
                label="Ongoing"
                value={currentStats.ongoing}
                sub="In Progress"
                color="text-amber-500"
                border="border-amber-200"
              />
              <MetricCard
                label="Resolved"
                value={currentStats.resolved}
                sub="Completed"
                color="text-emerald-500"
                border="border-emerald-200"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* CHART */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-5 sm:p-8 rounded-2xl shadow-sm flex flex-col min-h-[350px] sm:min-h-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight uppercase">
                    Performance Chart
                  </h3>
                  {/* Scrollable toggle buttons on mobile */}
                  <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {["Today", "Weekly", "Monthly"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                          timeRange === r
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "BACKLOG",
                          val: currentStats.pending,
                          color: "#cbd5e1",
                        },
                        {
                          name: "PROGRESS",
                          val: currentStats.ongoing,
                          color: "#f59e0b",
                        },
                        {
                          name: "RESOLVED",
                          val: currentStats.resolved,
                          color: "#10b981",
                        },
                      ]}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <Bar dataKey="val" radius={[8, 8, 0, 0]} maxBarSize={60}>
                        {/* Custom colors using Cell to prevent React map issues */}
                        <Cell fill="#cbd5e1" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* INFO PANEL */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none" />
                <div className="relative z-10 mb-8 lg:mb-0">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 sm:mb-6">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Verified Personnel
                    </span>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
                    Log: <br className="hidden lg:block" />
                    <span className="text-emerald-600">
                      {selectedUser.name}
                    </span>
                  </h4>
                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider leading-relaxed">
                    User is currently managing {currentStats.ongoing} active
                    tickets. Efficiency rating is stable at 94.2% for the
                    current {timeRange.toLowerCase()} cycle.
                  </p>
                </div>
                <button className="relative z-10 w-full py-3 sm:py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs tracking-widest transition-all uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md">
                  <Download size={14} /> Export Dataset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🟢 CSS MEDIA QUERIES APPLIED HERE */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }

        .search-icon-animated { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .search-input:focus ~ .search-icon-animated { color: #10b981; }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
        
        /* 🟢 RESPONSIVE MARGIN LOGIC */
        .responsive-main {
          margin-left: 0px;
        }
        
        @media (min-width: 1024px) {
          .responsive-main {
            margin-left: var(--sidebar-width, 256px);
          }
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s ease; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease both; }
      `}</style>
    </div>
  );
}

// Fixed spacing and font sizes for mobile
function MetricCard({ label, value, sub, border, color }: any) {
  return (
    <div
      className={`p-6 sm:p-8 bg-white border ${border} rounded-2xl shadow-sm flex flex-col items-center justify-center text-center transition-all`}
    >
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 sm:mb-3">
        {label}
      </span>
      <span
        className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none ${color}`}
      >
        {value}
      </span>
      <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest">
        {sub}
      </p>
    </div>
  );
}
