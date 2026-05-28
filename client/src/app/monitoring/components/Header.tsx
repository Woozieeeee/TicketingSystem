"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, RotateCcw, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  view: "list" | "stats" | "activities" | "alerts";
  setView: (view: "list" | "stats" | "activities" | "alerts") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  displayDate: string;
  todayFormatted: string;
  liveTime: string;
  setDisplayDate: (date: string) => void;
  dateInputRef: React.RefObject<HTMLInputElement>;
}

const Header: React.FC<HeaderProps> = ({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  displayDate,
  todayFormatted,
  liveTime,
  setDisplayDate,
  dateInputRef,
}) => {
  const router = useRouter();

  // Live clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevTime, setPrevTime] = useState(new Date());

  // Update time every second with smooth transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTime(currentTime);
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Check if seconds changed for animation trigger
  const secondsChanged = currentTime.getSeconds() !== prevTime.getSeconds();

  return (
    <header className="mb-6 sm:mb-8 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        
        {/* LEFT SIDE - TITLE & BACK BUTTON */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Main Dashboard Back Button - only in list view */}
          {view === "list" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 sm:p-2.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-100 text-slate-500 transition-all active:scale-95 shadow-sm flex-shrink-0"
              title="Go back to dashboard"
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Toggle View Back Button (only shows when in stats) */}
          {view === "stats" && (
            <button
              onClick={() => setView("list")}
              className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
              title="Back to list"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {view === "list" ? "Monitoring" : 
               view === "stats" ? "Performance" :
               view === "activities" ? "Activities" : "Alerts"}
            </h1>
            
            {/* Monitoring Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mt-2">
              {[
                { id: 'list', label: 'Personnel' },
                { id: 'stats', label: 'Performance' },
                { id: 'activities', label: 'Activities' },
                { id: 'alerts', label: 'Alerts' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setView(id as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* SEARCH BAR - Below tabs (only in list view) */}
            {view === "list" && (
              <div className="relative w-full lg:w-[700px] mt-3">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search monitoring activities, logs, sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-5 py-3 bg-white border border-slate-200 rounded-xl outline-none transition-all font-semibold text-sm shadow-sm hover:border-slate-300 focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - DATE & TIME SECTION */}
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
              className="flex flex-col items-center bg-white border border-slate-200 p-2 sm:p-3 rounded-lg shadow-sm cursor-pointer hover:border-emerald-500 transition-colors min-w-[100px] sm:min-w-[120px]"
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
                    })
                  )
                }
                className="hidden"
              />
              
              {/* TIME - Top, bigger, bold with animation */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Clock size={14} className="text-emerald-500" />
                <span 
                  className={`font-mono font-black text-sm sm:text-base lg:text-lg tabular-nums text-slate-800 transition-all duration-300 ease-in-out ${
                    secondsChanged ? 'scale-105' : 'scale-100'
                  }`}
                >
                  {formatTime(currentTime)}
                </span>
              </div>
              
              {/* DATE - Bottom, smaller, muted */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar size={12} className="text-slate-400" />
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-tight">
                  {displayDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;