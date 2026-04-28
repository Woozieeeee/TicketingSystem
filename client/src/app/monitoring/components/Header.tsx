"use client";
import React from "react";
import { ArrowLeft, Search, RotateCcw, Clock, Calendar } from "lucide-react";

interface HeaderProps {
  view: "list" | "stats";
  setView: (view: "list" | "stats") => void;
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
  return (
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
      </div>
    </header>
  );
};

export default Header;