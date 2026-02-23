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
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  Download,
} from "lucide-react";

// --- DATA ---
const IT_TEAM = [
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
    name: "Palku Chupapi",
    role: "Helpdesk",
    trend: [40, 80, 60, 120, 100, 180, 210],
    color: "#8b5cf6",
  },
  {
    id: "u5",
    name: "Christine Rose",
    role: "Systems Engineer",
    trend: [15, 30, 25, 50, 45, 70, 95],
    color: "#ec4899",
  },
  {
    id: "u6",
    name: "Matt",
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
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

  const todayFormatted = new Date().toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

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

  const filteredTeam = useMemo(() => {
    return IT_TEAM.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  if (!isMounted) return null;

  return (
    <div className="p-6 md:p-10 bg-[#f8fafc] min-h-screen text-slate-900 font-sans relative">
      {/* HEADER: Perfectly Aligned */}
      <header className="mb-12 flex items-center justify-between gap-8">
        <div className="flex items-center gap-6 shrink-0">
          {view === "stats" && (
            <button
              onClick={() => setView("list")}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
              IT Head View
            </span>
            <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">
              Monitoring
            </h1>
          </div>
        </div>

        {view === "list" && (
          <div className="flex-1 max-w-xl relative group">
            <input
              type="text"
              placeholder="Search staff, roles, or specializations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold text-sm shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm shrink-0">
          <div className="px-4 border-r border-slate-100 flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" />
            <span className="font-mono font-bold text-xs">{liveTime}</span>
          </div>
          <div className="px-4 flex items-center gap-2">
            <Calendar size={14} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-tight">
              {displayDate}
            </span>
          </div>
        </div>
      </header>

      {/* VIEW 1: DIRECTORY */}
      {view === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {filteredTeam.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setView("stats");
              }}
              className="bg-white border border-slate-100 p-8 rounded-[40px] hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                  <UserIcon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full self-start">
                  Online
                </span>
              </div>
              <h3 className="text-2xl font-black mb-1">{user.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {user.role}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: STATISTICS */}
      {view === "stats" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Pending"
              value={currentStats.pending}
              sub={`Records for ${displayDate}`}
              border="border-slate-200"
            />
            <MetricCard
              label="Ongoing"
              value={currentStats.ongoing}
              sub={`Active on ${displayDate}`}
              border="border-amber-200"
            />
            <MetricCard
              label="Resolved"
              value={currentStats.resolved}
              sub={`Closed on ${displayDate}`}
              border="border-emerald-200"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ANALYTICS BAR CHART */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black tracking-tight">
                  {timeRange} Analytics: {displayDate}
                </h3>
                <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  {["Today", "Weekly", "Monthly"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${timeRange === r ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[350px]">
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
                        fill: "#10b981",
                      },
                    ]}
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
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Bar dataKey="val" radius={[12, 12, 12, 12]} barSize={64} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SECURITY CARD: White Theme */}
            <div className="bg-white border border-slate-100 p-10 rounded-[48px] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-emerald-100 transition-colors" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-10">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    Security Verified
                  </span>
                </div>

                <h4 className="text-4xl font-black italic tracking-tighter mb-4 leading-tight">
                  Stats for{" "}
                  <span className="text-emerald-600">{selectedUser.name}</span>
                </h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
                  Automated daily backup confirmed. Performance is within target
                  margins for the selected period.
                </p>
              </div>

              <button className="relative z-10 w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] font-black text-[10px] tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                <Download size={14} />
                Export Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, border }: any) {
  return (
    <div className={`p-10 bg-white border ${border} rounded-[40px] shadow-sm`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4 italic">
        {label}
      </span>
      <span className="text-7xl font-black tracking-tighter leading-none">
        {value}
      </span>
      <p className="mt-6 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
        {sub}
      </p>
    </div>
  );
}
