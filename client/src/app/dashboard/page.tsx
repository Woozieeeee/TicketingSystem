"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getRelativeTime } from "../../lib/utils";
import CreateTicketModal from "../../components/createTicketModal";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Ticket as TicketIcon,
} from "lucide-react";

export default function RoleBasedDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState("just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ANALYTICS DASHBOARD STATE
  const [time, setTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState("All Time");

  // INTERACTIVE CALENDAR STATE
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // LIVE CLOCK HOOK
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTickets = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);

    try {
      const params = new URLSearchParams();
      if (parsedUser?.role) params.set("role", parsedUser.role);
      if (parsedUser?.dept) params.set("dept", parsedUser.dept);
      if (parsedUser?.username) params.set("username", parsedUser.username);

      const res = await fetch(
        `http://localhost:3001/api/tickets?${params.toString()}`,
      );

      if (res.ok) {
        const allTickets = await res.json();
        if (!Array.isArray(allTickets)) {
          setTickets([]);
          return;
        }
        const transformed = allTickets.map((t: any) => ({
          ...t,
          status:
            t.status === "PENDING"
              ? "Pending"
              : t.status === "IN_PROGRESS"
                ? "In Progress"
                : t.status === "RESOLVED"
                  ? "Resolved"
                  : t.status === "FINISHED"
                    ? "Finished"
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
  const finishedCount = tickets.filter((t) => t.status === "Finished").length;

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
      ? {
          color: "#e11d48",
          bgTw: "bg-rose-50",
          colorTw: "text-rose-500",
          textTw: "text-rose-800",
          borderTw: "border-rose-200",
        }
      : {
          color: "#16a34a",
          bgTw: "bg-green-50",
          colorTw: "text-green-500",
          textTw: "text-green-800",
          borderTw: "border-green-200",
        };

  // 🔴 UPDATED: HEAD ANALYTICS LOGIC (BAR GRAPH + SPECIFIC COUNTS)
  const stats = useMemo(() => {
    let filtered = tickets || [];
    const now = new Date().getTime();
    const currentYear = time.getFullYear();

    if (selectedDate) {
      filtered = filtered.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      });
    } else {
      if (timeFilter === "Last 7 Days")
        filtered = filtered.filter(
          (t) => now - new Date(t.date).getTime() <= 7 * 24 * 60 * 60 * 1000,
        );
      else if (timeFilter === "Last 30 Days")
        filtered = filtered.filter(
          (t) => now - new Date(t.date).getTime() <= 30 * 24 * 60 * 60 * 1000,
        );
      else if (timeFilter === "This Year")
        filtered = filtered.filter(
          (t) => new Date(t.date).getFullYear() === currentYear,
        );
    }

    const pen = filtered.filter((t) => t.status === "Pending").length;
    const inp = filtered.filter((t) => t.status === "In Progress").length;
    const res = filtered.filter((t) => t.status === "Resolved").length;
    const fin = filtered.filter((t) => t.status === "Finished").length;

    // 🟢 Workload Logic: Only count users with Pending or In Progress tickets
    const activeRequestingUsers = new Set(
      filtered
        .filter((t) => t.status === "Pending" || t.status === "In Progress")
        .map((t) => t.createdBy),
    ).size;

    const completedTickets = res + fin;

    const chartData = [
      { name: "Pending", value: pen, color: "#f59e0b" },
      { name: "In Prog", value: inp, color: "#6366f1" },
      { name: "Resolved", value: res, color: "#16a34a" },
      { name: "Finished", value: fin, color: "#06b6d4" },
    ];

    return {
      total: filtered.length,
      activeRequestingUsers,
      completedTickets,
      chartData,
    };
  }, [tickets, timeFilter, time, selectedDate]);

  const handlePrevMonth = () =>
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
    );

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    if (selectedDate && selectedDate.getTime() === clickedDate.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(clickedDate);
      setTimeFilter("Custom Date");
    }
  };

  const currentMonthName = calendarMonth.toLocaleString("default", {
    month: "long",
  });
  const currentYearNum = calendarMonth.getFullYear();
  const firstDayOfMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 rounded-full border-slate-200 animate-spin"
            style={{ borderTopColor: deptAccent.color }}
          />
          <p className="text-sm font-medium text-slate-500">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  const totalTicketsAll =
    pendingCount + inProgressCount + resolvedCount + finishedCount;

  return (
    <div className="min-h-screen bg-slate-50">
      <main
        className="transition-all duration-300 ease-in-out bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen font-sans"
        style={{ marginLeft: "var(--sidebar-width, 256px)" }}
      >
        {/* ── HEADER ── */}
        <div
          className="mb-8 animate-slideUpFade"
          style={{ animationDelay: "0s", animationFillMode: "both" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl border-1.5 flex items-center justify-center font-black text-lg flex-shrink-0 ${deptAccent.bgTw} ${deptAccent.colorTw} ${deptAccent.borderTw}`}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {user.dept}{" "}
                  <span style={{ color: deptAccent.color }}>{user.role}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Last activity {getRelativeTime(displayDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all"
                onClick={handleRefresh}
                title="Refresh dashboard"
              >
                <svg
                  className={isRefreshing ? "animate-spin" : ""}
                  width="18"
                  height="18"
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
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
                  style={{ backgroundColor: deptAccent.color }}
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Ticket
                </button>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-base leading-none transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
                  onClick={() => router.push("/tickets")}
                  style={{ backgroundColor: deptAccent.color }}
                >
                  <svg
                    width="16"
                    height="16"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div
            className="card bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slideUpFade"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-lg" />
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3.5 flex-shrink-0 transition-transform hover:scale-110">
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
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {pendingCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Pending
            </p>
            <p className="text-xs text-slate-400 mb-3.5 whitespace-nowrap">
              Awaiting response
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out"
                style={{
                  width: totalTicketsAll
                    ? `${(pendingCount / totalTicketsAll) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <div
            className="card bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slideUpFade"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-lg" />
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3.5 flex-shrink-0 transition-transform hover:scale-110">
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
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {inProgressCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 whitespace-nowrap">
              In Progress
            </p>
            <p className="text-xs text-slate-400 mb-3.5 whitespace-nowrap">
              Currently working
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
                style={{
                  width: totalTicketsAll
                    ? `${(inProgressCount / totalTicketsAll) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <div
            className="card bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slideUpFade"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-lg" />
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3.5 flex-shrink-0 transition-transform hover:scale-110">
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
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {resolvedCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 whitespace-nowrap">
              Resolved
            </p>
            <p className="text-xs text-slate-400 mb-3.5 whitespace-nowrap">
              Awaiting verification
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-1000 ease-out"
                style={{
                  width: totalTicketsAll
                    ? `${(resolvedCount / totalTicketsAll) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <div
            className="card bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slideUpFade"
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-lg" />
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-3.5 flex-shrink-0 transition-transform hover:scale-110">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {finishedCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 whitespace-nowrap">
              Finished
            </p>
            <p className="text-xs text-slate-400 mb-3.5 whitespace-nowrap">
              Fully closed out
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-1000 ease-out"
                style={{
                  width: totalTicketsAll
                    ? `${(finishedCount / totalTicketsAll) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── PROFILE & ANALYTICS SECTION ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
          {/* PROFILE CARD */}
          <div
            className="card bg-white border border-slate-200 p-6 animate-slideUpFade h-auto"
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-12 h-12 rounded-lg border-1.5 flex items-center justify-center font-black text-base flex-shrink-0 ${deptAccent.bgTw} ${deptAccent.colorTw} ${deptAccent.borderTw}`}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 mb-1 truncate">
                  {user.username}
                </p>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${deptAccent.bgTw} ${deptAccent.textTw}`}
                >
                  {user.dept}
                </span>
              </div>
            </div>
            <div className="divider my-2.5" />
            {[
              { label: "Role", value: user.role },
              { label: "Department", value: user.dept },
              { label: "Access Level", value: user.role },
            ].map(({ label, value }, i, arr) => (
              <div key={label}>
                <div className="flex items-center justify-between py-2.75">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {value}
                  </span>
                </div>
                {i < arr.length - 1 && <div className="divider my-0" />}
              </div>
            ))}
          </div>

          {/* ── UNIFIED ANALYTICS DASHBOARD CARD ── */}
          <div
            className="card bg-white border border-slate-200 flex flex-col overflow-hidden animate-slideUpFade"
            style={{ animationDelay: "0.6s", animationFillMode: "both" }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide whitespace-nowrap">
                {user.role === "Head"
                  ? "Department Analytics"
                  : "My Ticket Overview"}
              </h2>

              <div className="relative w-full sm:w-auto">
                <select
                  className="w-full sm:w-auto appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer transition-all hover:border-slate-300"
                  value={selectedDate ? "Custom Date" : timeFilter}
                  onChange={(e) => {
                    setSelectedDate(null);
                    setTimeFilter(e.target.value);
                  }}
                >
                  {selectedDate && (
                    <option value="Custom Date">Custom Date</option>
                  )}
                  <option value="All Time">All Time</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Year">This Year</option>
                </select>
                <Filter
                  size={12}
                  className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
                />
                <svg
                  className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="flex flex-1 flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100 min-h-0">
              {/* 🟢 HEAD ROLE SPECIFIC: ACTIVE REQUESTING USERS & COMPLETED DONUTS */}
              {/* 🟢 HEAD ROLE SPECIFIC: ACTIVE REQUESTING USERS & COMPLETED DONUTS */}
              {user.role === "Head" ? (
                <>
                  <div className="w-full xl:w-[220px] xl:max-w-[220px] p-6 flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-8 xl:gap-6 bg-white flex-shrink-0">
                    {/* REQUESTING USERS DONUT */}
                    <div className="flex flex-col items-center group relative cursor-help">
                      {" "}
                      {/* 🟢 Added 'relative' and 'cursor-help' */}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 whitespace-nowrap">
                        Requesting Users
                      </p>
                      <div className="relative w-20 h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <svg viewBox="0 0 36 36" width="80" height="80">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#f1f5f9"
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
                            strokeDasharray="100 100"
                            pathLength="100"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-xl font-black text-slate-800">
                            {stats.activeRequestingUsers}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            Active
                          </span>
                        </div>
                      </div>
                      {/* 🟢 FIXED TOOLTIP: Added z-50 and pointer-events-none */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                        Unique users with Pending or In-Progress tickets
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>

                    {/* COMPLETED REQUESTS DONUT */}
                    <div className="flex flex-col items-center group relative cursor-help">
                      {" "}
                      {/* 🟢 Added 'relative' and 'cursor-help' */}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 whitespace-nowrap">
                        Completed Requests
                      </p>
                      <div className="relative w-20 h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <svg viewBox="0 0 36 36" width="80" height="80">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray="100 100"
                            pathLength="100"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-xl font-black text-slate-800">
                            {stats.completedTickets}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            Done
                          </span>
                        </div>
                      </div>
                      {/* 🟢 FIXED TOOLTIP: Added z-50 and pointer-events-none */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                        Sum of Resolved and Finished tickets
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* 📊 BAR CHART CONTAINER */}
              <div className="flex-1 p-6 flex flex-col min-h-[250px] w-full min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-slate-600">
                  <BarChart3 size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    {user.role === "Head"
                      ? "Department Ticket Status"
                      : "My Tickets"}
                  </span>
                </div>

                <div className="w-full h-[200px] relative min-w-0 block">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart
                        data={stats.chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 10,
                            fill: "#64748b",
                            fontWeight: 600,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                          }}
                          itemStyle={{ fontWeight: "bold" }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                          animationDuration={1000}
                        >
                          {stats.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 📅 INTERACTIVE CLOCK & CALENDAR */}
              <div className="w-full xl:w-[280px] p-6 bg-slate-50/50 flex flex-col items-center justify-center flex-shrink-0">
                <div className="text-center mb-5 w-full flex flex-col items-center">
                  {/* 🟢 FIXED: Reduced font-size and aligned layout */}
                  <div className="flex items-center justify-center gap-2 text-slate-800 h-[60px] w-full">
                    <div className="flex flex-col items-center leading-none">
                      {/* Main Time: Reduced to text-2xl for better alignment */}
                      <span
                        className="text-2xl font-black tracking-tight tabular-nums"
                        style={{ fontFamily: "Syne, sans-serif" }}
                      >
                        {time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </span>

                      {/* AM/PM: Smaller sub-text aligned underneath or beside */}
                      <span className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
                        {time
                          .toLocaleTimeString([], { hour12: true })
                          .split(" ")
                          .pop()}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 mt-2 h-[20px]">
                    <CalendarIcon size={12} />
                    {time.toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="w-full bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors active:scale-95"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="text-center text-[10px] font-bold uppercase text-slate-600 tracking-wider whitespace-nowrap">
                      {currentMonthName} {currentYearNum}
                    </div>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors active:scale-95"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                    {blanks.map((_, i) => (
                      <div key={`blank-${i}`} />
                    ))}
                    {days.map((day) => {
                      const isToday =
                        day === time.getDate() &&
                        calendarMonth.getMonth() === time.getMonth() &&
                        calendarMonth.getFullYear() === time.getFullYear();
                      const isSelected =
                        selectedDate?.getDate() === day &&
                        selectedDate?.getMonth() === calendarMonth.getMonth() &&
                        selectedDate?.getFullYear() ===
                          calendarMonth.getFullYear();

                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`p-1 rounded-md aspect-square flex items-center justify-center transition-all cursor-pointer transform hover:scale-110 active:scale-95 ${
                            isSelected
                              ? "text-white font-bold shadow-md hover:opacity-90"
                              : isToday
                                ? "bg-slate-100 font-bold border border-slate-300 text-slate-800"
                                : "text-slate-600 hover:bg-slate-100"
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: deptAccent.color }
                              : {}
                          }
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CreateTicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadTickets}
        />
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-slideUpFade {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        html { font-family: 'DM Sans', sans-serif; }
        h1, .header-title { font-family: 'Syne', sans-serif; font-weight: 700; }
        .stat-number { font-family: 'Syne', sans-serif; font-weight: 700; }
        .card { position: relative; }
        .divider { height: 1px; background: #f5f6f9; margin: 0; }
        .badge { display: inline-flex; align-items: center; }
      `}</style>
    </div>
  );
}
