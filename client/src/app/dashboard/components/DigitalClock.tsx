"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";

interface DigitalClockProps {
  time: Date;
}

// Component para sa bawat digit na may slot machine effect
const Digit = ({ value }: { value: string }) => {
  return (
    <div className="relative w-[30px] h-[40px] overflow-hidden bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shadow-inner">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-2xl font-black text-slate-800"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const DigitalClock: React.FC<DigitalClockProps> = ({ time }) => {
  // Logic para sa 12-hour format
  const hours = time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";

  const hString = hours.toString().padStart(2, "0");
  const [h1, h2] = hString.split("");
  const [m1, m2] = minutes.split("");
  const [s1, s2] = seconds.split("");

  return (
    <div className="text-center p-6 bg-white border border-slate-200 rounded-3xl shadow-sm w-full max-w-xs mx-auto">
      {/* Time Display with Slot Machine effect */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <Digit value={h1} /><Digit value={h2} />
        <span className="font-black text-xl text-slate-300">:</span>
        <Digit value={m1} /><Digit value={m2} />
        <span className="font-black text-xl text-slate-300">:</span>
        <Digit value={s1} /><Digit value={s2} />
        
        {/* AM/PM Indicator - Maliit lang para hindi lumaki ang size */}
        <div className="flex flex-col text-[9px] font-black text-slate-400 ml-1">
            <span>{ampm}</span>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider bg-slate-50 py-1 px-3 rounded-full">
        <CalendarIcon size={12} />
        {time.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
      `}</style>
    </div>
  );
};

export default DigitalClock;