"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DashboardCalendarProps {
  calendarMonth: Date;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  currentMonthName: string;
  currentYearNum: number;
  blanks: any[];
  days: number[];
  tickets: any[];
  selectedDate: Date | null;
  timeFilter: string;
  handleDayClick: (day: number) => void;
  deptAccent: {
    color: string;
  };
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  calendarMonth,
  handlePrevMonth,
  handleNextMonth,
  currentMonthName,
  currentYearNum,
  blanks,
  days,
  tickets,
  selectedDate,
  timeFilter,
  handleDayClick,
  deptAccent,
}) => {
  return (
    <div className="w-full bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors active:scale-95"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-center text-[10px] font-black uppercase text-slate-600 tracking-wider whitespace-nowrap">
          {currentMonthName} {currentYearNum}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors active:scale-95"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-300 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const d = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            day
          );
          const dString = d.toDateString();
          const dMidnight = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
          ).getTime();
          const now = new Date();
          const todayMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          ).getTime();

          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = selectedDate?.toDateString() === dString;
          const isFuture = dMidnight > todayMidnight;

          const dayTickets = tickets.filter(
            (t) => new Date(t.activityDate).toDateString() === dString
          );
          const hasTickets = dayTickets.length > 0;
          const isBusyDay = dayTickets.length >= 5;

          let isInFilterRange = false;

          if (!isFuture) {
            if (timeFilter === "Last 7 Days")
              isInFilterRange =
                dMidnight >= todayMidnight - 6 * 24 * 60 * 60 * 1000;
            else if (timeFilter === "Last 30 Days")
              isInFilterRange =
                dMidnight >= todayMidnight - 29 * 24 * 60 * 60 * 1000;
            else if (timeFilter === "This Year")
              isInFilterRange = d.getFullYear() === now.getFullYear();
            else if (timeFilter === "All Time") isInFilterRange = hasTickets;
            else if (timeFilter === "Custom Date") isInFilterRange = isSelected;
          }

          let bgColor = "transparent";
          let textColor = "text-slate-400";
          let border = "border-transparent";

          if (isSelected) {
            bgColor = "";
            textColor = "text-white font-black shadow-md z-10 scale-110";
          } else if (isToday) {
            bgColor = "bg-green-100/60";
            textColor = "text-green-800 font-black";
            border = "border border-green-200";
          } else if (isFuture) {
            textColor = "text-slate-200 cursor-not-allowed";
          } else if (isInFilterRange) {
            if (hasTickets) {
              bgColor = isBusyDay ? "bg-green-600/40" : "bg-green-500/20";
              textColor = isBusyDay
                ? "text-green-900 font-black"
                : "text-green-700 font-bold";
            } else {
              bgColor = "bg-slate-100/80";
              textColor = "text-slate-400";
            }
          }

          return (
            <button
              key={day}
              onClick={() => !isFuture && handleDayClick(day)}
              disabled={isFuture}
              className={`p-1 rounded-md aspect-square flex items-center justify-center transition-all transform relative text-[10px] ${bgColor} ${textColor} ${border} ${
                !isFuture &&
                !isSelected &&
                "hover:bg-slate-200 cursor-pointer hover:scale-110 active:scale-95"
              }`}
              style={isSelected ? { backgroundColor: deptAccent.color } : {}}
            >
              {day}
              {hasTickets && !isSelected && !isToday && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    isBusyDay ? "bg-green-800" : "bg-green-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCalendar;