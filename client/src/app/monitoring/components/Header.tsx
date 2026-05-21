"use client";
import React from "react";
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
  monitoringStats?: any;
  autoRefresh?: boolean;
  setAutoRefresh?: (refresh: boolean) => void;
  loadMonitoringData?: () => void;
  loading?: boolean;
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
  monitoringStats,
  autoRefresh,
  setAutoRefresh,
  loadMonitoringData,
  loading,
}) => {
  // Inilipat sa loob ng component body para hindi mag-error
  const router = useRouter();

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
          </div>
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
                      })
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

        {/* MONITORING CONTROLS */}
        {monitoringStats && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Active Users:</span>
              <span className="font-semibold text-green-600">{monitoringStats.activeUsers24h?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">24h Activities:</span>
              <span className="font-semibold text-blue-600">{monitoringStats.recent24h || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Failed Logins:</span>
              <span className="font-semibold text-red-600">{monitoringStats.failedLogins24h || 0}</span>
            </div>
            
            {/* Auto-refresh toggle */}
            {setAutoRefresh && (
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  autoRefresh 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <RotateCcw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </button>
            )}
            
            {/* Manual refresh button */}
            {loadMonitoringData && (
              <button
                onClick={loadMonitoringData}
                disabled={loading}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;