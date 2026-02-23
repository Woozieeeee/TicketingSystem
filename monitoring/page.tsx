"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { ArrowLeft, User as UserIcon, Zap, CheckCircle2, Timer, Inbox, ChevronRight, Calendar, Clock, RotateCcw, Edit3, Search, X, TrendingUp } from "lucide-react";

const IT_TEAM = [
  { id: "u1", name: "Alice Johnson", role: "Senior Lead", trend: [20, 45, 30, 80, 50, 90, 140] },
  { id: "u2", name: "Bob Smith", role: "Network Tech", trend: [10, 20, 15, 40, 30, 60, 89] },
  { id: "u3", name: "Charlie Davis", role: "Security Analyst", trend: [5, 15, 10, 30, 25, 40, 67] },
  { id: "u4", name: "Dana White", role: "Helpdesk", trend: [40, 80, 60, 120, 100, 180, 210] },
  { id: "u5", name: "Edward Norton", role: "Systems Engineer", trend: [15, 30, 25, 50, 45, 70, 95] },
  { id: "u6", name: "Fiona Gallagher", role: "Database Admin", trend: [10, 25, 20, 45, 35, 60, 82] },
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
  const [currentStats, setCurrentStats] = useState({ pending: 0, ongoing: 0, resolved: 0 });
  const [liveTime, setLiveTime] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayFormatted = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });

  const filteredTeam = useMemo(() => {
    return IT_TEAM.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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

  useEffect(() => {
    if (selectedUser) setCurrentStats(getStatsForRange());
  }, [selectedUser, timeRange, displayDate]);

  if (!isMounted) return null;

  return (
    <div className="p-6 md:p-12 bg-[#FDFDFD] min-h-screen text-slate-900 font-sans tracking-tight">
      
      {/* HEADER (Sticky-ish) */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="flex items-center gap-6">
          {view === "stats" && (
            <button onClick={() => setView("list")} className="p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all">
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 p-1 rounded-md"><Zap size={16} fill="black" /></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Central Command</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
              IT <span className="text-emerald-600 underline decoration-amber-400 decoration-4 underline-offset-8">DEPARTMENT</span>
            </h1>
          </div>
        </div>

        {/* SEARCH BAR (List View) */}
        {view === "list" && (
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Filter personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-sm shadow-inner"
            />
          </div>
        )}

        {/* DATE & TIME (Stats View) */}
        {view === "stats" && (
          <div className="flex flex-col items-end gap-3">
             <div className="flex items-center gap-2">
                {displayDate !== todayFormatted && (
                  <button onClick={() => setDisplayDate(todayFormatted)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all">
                    <RotateCcw size={12} /> Sync Today
                  </button>
                )}
                <div onClick={() => dateInputRef.current?.showPicker()} className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-emerald-500 transition-all cursor-pointer relative group">
                  <input type="date" ref={dateInputRef} onChange={(e) => setDisplayDate(new Date(e.target.value).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-4">
                    <Calendar size={14} className="text-emerald-500" />
                    <span className="text-slate-900">{displayDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[90px]">
                    <Clock size={14} className="text-amber-500" />
                    <span className="font-mono">{liveTime}</span>
                  </div>
                </div>
             </div>
          </div>
        )}
      </header>

      {/* VIEW 1: STAFF DIRECTORY WITH MINI-GRAPHS */}
      {view === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
          {filteredTeam.map((user) => (
            <div key={user.id} onClick={() => { setSelectedUser(user); setView("stats"); }}
              className="group bg-white border-2 border-slate-100 p-8 rounded-[48px] hover:border-emerald-500 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[320px]">
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[20px] flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-500">
                    <UserIcon size={32} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Efficiency</p>
                    <p className="text-xl font-black text-emerald-600 italic">98%</p>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{user.name}</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-6">{user.role}</p>
              </div>

              {/* MINI MINI GRAPH */}
              <div className="h-20 w-full mt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={user.trend.map((v, i) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="#10b981" fill="#ecfdf5" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: STATISTICS (Full Dynamic Graph) */}
      {view === "stats" && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard label="Pending" value={currentStats.pending} icon={<Inbox />} accent="zinc" description={`Records for ${displayDate}`} />
            <MetricCard label="Ongoing" value={currentStats.ongoing} icon={<Timer />} accent="amber" description={`Active on ${displayDate}`} />
            <MetricCard label="Resolved" value={currentStats.resolved} icon={<CheckCircle2 />} accent="emerald" description={`Closed on ${displayDate}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border-2 border-slate-100 p-10 rounded-[56px] shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tighter">
                    <TrendingUp className="text-emerald-500" />
                    {timeRange} Analytics: {displayDate}
                  </h3>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    {["Today", "Weekly", "Monthly"].map((range) => (
                      <button key={range} onClick={() => setTimeRange(range)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${timeRange === range ? "bg-white text-slate-900 shadow-md scale-105" : "text-slate-400 uppercase"}`}>
                        {range.toUpperCase()}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'BACKLOG', val: currentStats.pending, fill: '#CBD5E1' },
                    { name: 'IN PROGRESS', val: currentStats.ongoing, fill: '#F59E0B' },
                    { name: 'RESOLVED', val: currentStats.resolved, fill: '#10B981' },
                  ]}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="val" radius={[20, 20, 20, 20]} barSize={80} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[56px] text-white flex flex-col justify-between relative shadow-2xl overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
               <div>
                  <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
                    <span className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px]">Security Verified</span>
                  </div>
                  <p className="text-4xl font-black leading-tight mb-10 tracking-tighter italic">Stats for <span className="text-emerald-500">{selectedUser.name}</span></p>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose">Automated daily backup confirmed. Performance is within target margins for the selected period.</p>
               </div>
               <button className="w-full py-6 mt-10 bg-white text-slate-900 rounded-[24px] font-black text-xs tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all uppercase shadow-xl">
                  Export Dataset
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, accent, description }: any) {
  const styles: any = {
    zinc: "text-slate-900 border-slate-200 bg-white hover:border-slate-400",
    amber: "text-amber-800 border-amber-200 bg-amber-50/40 hover:border-amber-500",
    emerald: "text-emerald-800 border-emerald-200 bg-emerald-50/40 hover:border-emerald-500"
  };
  return (
    <div className={`p-10 rounded-[48px] border-2 transition-all duration-500 shadow-sm ${styles[accent]}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-inherit text-slate-900">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 italic">{label}</span>
      </div>
      <span className="text-8xl font-black tracking-tighter leading-none">{value}</span>
      <p className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic">{description}</p>
    </div>
  );
}