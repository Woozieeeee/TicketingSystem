"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getRelativeTime } from "../../lib/utils";
import CreateTicketModal from "../../components/createTicketModal";
import { API_URL } from "../../config/api";

import StatsCards from "./components/StatsCards";
import UserSidebar from "./components/UserSidebar";
import VisualProgressChart from "./components/VisualProgressChart";
import DigitalClock from "./components/DigitalClock";
import DashboardCalendar from "./components/DashboardCalendar";

import { Filter } from "lucide-react";

export default function RoleBasedDashboard() {
  // --- STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]); // Initialize as empty array
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState("just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [time, setTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState("Custom date");

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // --- FUNCTIONS ---
  const loadTickets = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);

    try {
      const params = new URLSearchParams();
      if (parsedUser?.role) params.set("role", parsedUser.role);
      if (parsedUser?.dept) params.set("dept", parsedUser.dept);
      if (parsedUser?.username) params.set("username", parsedUser.username);

      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
        credentials: "include",
      });

      if (res.ok) {
        const allTickets = await res.json();
        if (!Array.isArray(allTickets)) {
          setTickets([]);
          return;
        }
        const transformed = allTickets.map((t: any) => ({
          ...t,
          activityDate: t.last_reminded_at || t.updatedAt || t.createdAt || t.date,
          status:
            t.status === "PENDING" ? "Pending" :
            t.status === "IN_PROGRESS" ? "In Progress" :
            t.status === "RESOLVED" ? "Resolved" :
            t.status === "FINISHED" ? "Finished" : t.status,
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

  // --- USE EFFECTS ---

  // 1. Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Time Ago (Relative time)
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
      if (seconds < 60) setTimeAgo("just now");
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // 3. Main Logic: Auth + Initial Load + Focus Refresh
 useEffect(() => {
    // A. Check Auth
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.log("No user found, redirecting...");
      router.push("/login");
      return;
    }

    // B. Set User and Load Data
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadTickets();

    // C. Window Focus Refresh
    const handleFocus = () => {
      console.log("Window focused, refreshing tickets...");
      loadTickets();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    
    // PALITAN MO ITONG LINE SA BABA:
  }, []); // Sinama ang loadTickets para safe pero stable ito dahil sa useCallback

  // Dito na magpapatuloy yung filters and return/interface mo...

  // 1. Siguraduhin na may tickets bago mag-sort para hindi mag-error
const latestTicket = tickets && tickets.length > 0 
  ? [...tickets].sort((a, b) => {
      const dateA = a.activityDate ? new Date(a.activityDate).getTime() : 0;
      const dateB = b.activityDate ? new Date(b.activityDate).getTime() : 0;
      return dateB - dateA;
    })[0]
  : null;

// 2. Eto yung part na nag-re-red sa iyo, lagyan natin ng "?" (Optional Chaining)
const displayDate = latestTicket?.activityDate 
    ? latestTicket.activityDate 
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

 const stats = useMemo<any>(() => {
    let filtered = tickets || [];
    const now = new Date().getTime();
    const currentYear = time.getFullYear();

    if (selectedDate) {
      filtered = filtered.filter((t) => {
        const d = new Date(t.activityDate);
        return (
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      });
    } else {
      if (timeFilter === "Last 7 Days") {
        filtered = filtered.filter(
          (t) => now - new Date(t.activityDate).getTime() <= 7 * 24 * 60 * 60 * 1000
        );
      } else if (timeFilter === "Last 30 Days") {
        filtered = filtered.filter(
          (t) => now - new Date(t.activityDate).getTime() <= 30 * 24 * 60 * 60 * 1000
        );
      } else if (timeFilter === "This Year") {
        filtered = filtered.filter(
          (t) => new Date(t.activityDate).getFullYear() === currentYear
        );
      }
    }

    const rem = filtered.filter(
      (t) => t.reminder_flag === 1 && t.status !== "Resolved" && t.status !== "Finished"
    ).length;
    const pen = filtered.filter((t) => t.status === "Pending" && t.reminder_flag !== 1).length;
    const inp = filtered.filter((t) => t.status === "In Progress" && t.reminder_flag !== 1).length;
    const res = filtered.filter((t) => t.status === "Resolved").length;
    const fin = filtered.filter((t) => t.status === "Finished").length;

    const activeRequestingUsers = new Set(
      filtered
        .filter((t) => t.status === "Pending" || t.status === "In Progress")
        .map((t) => t.createdBy)
    ).size;

    const completedTickets = res + fin;

    const chartData = [
      { name: "Reminded", value: rem, color: "#e11d48" },
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
      rem, 
      pen, 
      inp, 
      res, 
      fin 
    };
  }, [tickets, timeFilter, time, selectedDate]);

  // Ito ang mga variables na gagamitin ng interface mo sa baba
  const remindersCount = stats?.rem || 0;
  const pendingCount = stats?.pen || 0;
  const inProgressCount = stats?.inp || 0;
  const resolvedCount = stats?.res || 0;
  const finishedCount = stats?.fin || 0;
  

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

  return (
    <div className="min-h-screen bg-slate-50">
      <main
        className="transition-all duration-300 ease-in-out bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen font-sans"
        style={{
          marginLeft:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? "var(--sidebar-width, 256px)"
              : "0px",
        }}
      >
        {/* Header Section */}
        <div
          className="mb-8 animate-slideUpFade"
          style={{ animationDelay: "0s", animationFillMode: "both" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl border-1.5 flex items-center justify-center font-black text-lg flex-shrink-0 ${deptAccent.bgTw} ${deptAccent.colorTw} ${deptAccent.borderTw}`}
                >
                  {user?.username?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {user?.dept}{" "}
                    <span style={{ color: deptAccent.color }}>
                      {user?.role}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Last activity {getRelativeTime(displayDate)}
                  </p>
                </div>
              </div>
              <button
                className="sm:hidden inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all flex-shrink-0"
                onClick={handleRefresh}
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
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                className="hidden sm:inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all flex-shrink-0"
                onClick={handleRefresh}
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

              {user?.role === "User" ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto shadow-sm"
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
                  </svg>{" "}
                  Need Help? Create a Ticket
                </button>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-base leading-none transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto shadow-sm"
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
                  </svg>{" "}
                  Manage Queue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          remindersCount={remindersCount}
          pendingCount={pendingCount}
          inProgressCount={inProgressCount}
          resolvedCount={resolvedCount}
          finishedCount={finishedCount}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
          {/* User Sidebar */}
          <UserSidebar user={user} deptAccent={deptAccent} />

          {/* Analytics Panel */}
          <div
            className="card bg-white border border-slate-200 flex flex-col overflow-hidden animate-slideUpFade shadow-sm"
            style={{ animationDelay: "0.6s", animationFillMode: "both" }}
          >
            {/* Panel Header with Filter */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide whitespace-nowrap">
                {user?.role === "Head"
                  ? "Department Analytics"
                  : "My Ticket Overview"}
              </h2>
              <div className="relative w-full sm:w-auto">
                <select
                  className="w-full sm:w-auto appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer transition-all hover:border-slate-300 shadow-sm"
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

            {/* Content Area */}
            <div className="flex flex-1 flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100 min-h-0">
              {/* Head Stats (only for Head role) */}
              {user?.role === "Head" ? (
                <>
                  <div className="w-full xl:w-[220px] xl:max-w-[220px] p-6 flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-8 xl:gap-6 bg-white flex-shrink-0">
                    <div className="flex flex-col items-center group relative cursor-help">
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
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                        Unique users with Pending or In-Progress tickets
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center group relative cursor-help">
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
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                        Sum of Resolved and Finished tickets
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Visual Progress Chart */}
              <VisualProgressChart chartData={stats.chartData} />

              {/* Right Side: Clock & Calendar */}
              <div className="w-full xl:w-[280px] p-6 bg-slate-50/50 flex flex-col items-center justify-center flex-shrink-0">
                <DigitalClock time={time} />
                <DashboardCalendar
                  calendarMonth={calendarMonth}
                  handlePrevMonth={handlePrevMonth}
                  handleNextMonth={handleNextMonth}
                  currentMonthName={currentMonthName}
                  currentYearNum={currentYearNum}
                  blanks={blanks}
                  days={days}
                  tickets={tickets}
                  selectedDate={selectedDate}
                  timeFilter={timeFilter}
                  handleDayClick={handleDayClick}
                  deptAccent={deptAccent}
                />
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
        @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-slideUpFade { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes urgentGlow { 0%, 100% { box-shadow: 0 0 5px rgba(225, 29, 72, 0.3); } 50% { box-shadow: 0 0 20px rgba(225, 29, 72, 0.8); } }
        html { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, .font-black, .header-title, .stat-number { font-family: 'Syne', sans-serif; font-weight: 700; }
        .card { position: relative; }
        .divider { height: 1px; background: #f5f6f9; margin: 0; }
      `}</style>
    </div>
  );
}