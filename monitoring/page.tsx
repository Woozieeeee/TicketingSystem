"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, User as UserIcon, Calendar, Clock, ShieldCheck, Download, RotateCcw, Search } from "lucide-react";

// --- Types ---
interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
}

const IT_TEAM: TeamMember[] = [
  { id: "u1", name: "Kim De Vera", role: "Senior Lead", trend: [20, 45, 30, 80, 50, 90, 140], color: "#10b981" },
  { id: "u2", name: "Deanbry", role: "Network Tech", trend: [10, 20, 15, 40, 30, 60, 89], color: "#3b82f6" },
  { id: "u3", name: "Sam White", role: "Security Analyst", trend: [5, 15, 10, 30, 25, 40, 67], color: "#f59e0b" },
  { id: "u4", name: "SAMSAM", role: "Helpdesk", trend: [40, 80, 60, 120, 100, 180, 210], color: "#8b5cf6" },
  { id: "u5", name: "Nevaeh Christine Rose", role: "Systems Engineer", trend: [15, 30, 25, 50, 45, 70, 95], color: "#ec4899" },
  { id: "u6", name: "John Christian Alcantara", role: "Database Admin", trend: [10, 25, 20, 45, 35, 60, 82], color: "#06b6d4" },
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
  const [currentStats, setCurrentStats] = useState({ pending: 0, ongoing: 0, resolved: 0 });
  const [liveTime, setLiveTime] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayFormatted = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });

  // Handle Clock and Initial Date
  useEffect(() => {
    setIsMounted(true);
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
    return IT_TEAM.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]" />;

  return (
    <div className="p-4 md:p-10 bg-[#f8fafc] min-h-screen text-slate-900 font-sans">
      
      {/* HEADER SECTION */}
      <header className="mb-8 md:mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {view === "stats" && (
            <button 
              onClick={() => setView("list")} 
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
              IT Head {view === "stats" ? `/ ${selectedUser?.name}` : "View"}
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none uppercase">
              {view === "list" ? "Monitoring" : "Performance"}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:row sm:flex-row items-stretch sm:items-center gap-3">
          {view === "list" && (
            <div className="relative flex-1 sm:min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search personnel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold text-sm shadow-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {displayDate !== todayFormatted && (
              <button 
                onClick={() => setDisplayDate(todayFormatted)}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 whitespace-nowrap"
              >
                <RotateCcw size={12} /> Sync
              </button>
            )}

            <div 
              onClick={() => dateInputRef.current?.showPicker()} 
              className="flex items-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm cursor-pointer hover:border-emerald-500 transition-colors whitespace-nowrap"
            >
              <input 
                type="date" 
                ref={dateInputRef} 
                onChange={(e) => setDisplayDate(new Date(e.target.value).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }))} 
                className="absolute inset-0 opacity-0 w-0 h-0" 
              />
              <div className="px-3 border-r border-slate-100 flex items-center gap-2">
                <Clock size={14} className="text-emerald-500" />
                <span className="font-mono font-bold text-[10px] md:text-xs">{liveTime}</span>
              </div>
              <div className="px-3 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-500" />
                <span className="text-[10px] md:text-xs font-black uppercase">{displayDate}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* VIEW 1: PERSONNEL DIRECTORY */}
      {view === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredTeam.map((user) => (
            <div 
              key={user.id} 
              onClick={() => { setSelectedUser(user); setView("stats"); }}
              className="bg-white border border-slate-100 p-6 md:p-8 rounded-[32px] md:rounded-[40px] hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex justify-between mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                  <UserIcon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full self-start">Online</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-1">{user.name}</h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: STATISTICS & ANALYTICS */}
      {view === "stats" && selectedUser && (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <MetricCard label="Pending" value={currentStats.pending} sub="Backlog" color="text-slate-400" border="border-slate-200" />
            <MetricCard label="Ongoing" value={currentStats.ongoing} sub="In Progress" color="text-amber-500" border="border-amber-200" />
            <MetricCard label="Resolved" value={currentStats.resolved} sub="Completed" color="text-emerald-500" border="border-emerald-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* CHART */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
                <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">Performance Chart</h3>
                <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl w-full sm:w-auto">
                  {["Today", "Weekly", "Monthly"].map(r => (
                    <button 
                      key={r} 
                      onClick={() => setTimeRange(r)} 
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black transition-all ${timeRange === r ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[250px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'BACKLOG', val: currentStats.pending, color: '#cbd5e1' },
                    { name: 'PROGRESS', val: currentStats.ongoing, color: '#f59e0b' },
                    { name: 'RESOLVED', val: currentStats.resolved, color: '#10b981' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={window?.innerWidth < 640 ? 40 : 64}>
                      {[{ name: 'BACKLOG', val: currentStats.pending, color: '#cbd5e1' },
                        { name: 'PROGRESS', val: currentStats.ongoing, color: '#f59e0b' },
                        { name: 'RESOLVED', val: currentStats.resolved, color: '#10b981' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* INFO PANEL */}
            <div className="bg-white border border-slate-100 p-8 md:p-10 rounded-[32px] md:rounded-[48px] flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mb-6 md:mb-10">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified Personnel</span>
                </div>
                <h4 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-4 leading-tight">
                  Log: <span className="text-emerald-600">{selectedUser.name}</span>
                </h4>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider leading-relaxed mb-8">
                  User is currently managing {currentStats.ongoing} active tickets. Efficiency rating is stable at 94.2% for the current {timeRange.toLowerCase()} cycle.
                </p>
              </div>
              <button className="relative z-10 w-full py-5 bg-slate-900 hover:bg-emerald-600 text-white rounded-[20px] md:rounded-[24px] font-black text-[10px] tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                <Download size={14} /> Export Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update your MetricCard component with this version:

function MetricCard({ label, value, sub, border, color }: any) {
  return (
    <div className={`p-8 md:p-10 bg-white border ${border} rounded-[32px] md:rounded-[40px] shadow-sm flex flex-col items-center justify-center text-center transition-all`}>
      {/* Label - Centered */}
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 italic">
        {label}
      </span>
      
      {/* Main Metric - Large and Centered */}
      <span className={`text-6xl md:text-7xl font-black tracking-tighter leading-none ${color}`}>
        {value}
      </span>
      
      {/* Subtext - Centered */}
      <p className="mt-4 md:mt-6 text-[9px] font-bold text-slate-300 uppercase tracking-widest max-w-[120px] md:max-w-none">
        {sub}
      </p>
    </div>
  );
}