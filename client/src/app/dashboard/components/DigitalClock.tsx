"use client";

import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface DigitalClockProps {
  time: Date;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ time }) => {
  return (
    <div className="text-center mb-5 w-full flex flex-col items-center">
      {/* Time Display */}
      <div className="flex items-center justify-center gap-2 text-slate-800 h-[60px] w-full">
        <div className="flex flex-col items-center leading-none">
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
          <span className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
            {time
              .toLocaleTimeString([], { hour12: true })
              .split(" ")
              .pop()}
          </span>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 mt-2 h-[20px]">
        <CalendarIcon size={12} />
        {time.toLocaleDateString(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
      `}</style>
    </div>
  );
};

export default DigitalClock;