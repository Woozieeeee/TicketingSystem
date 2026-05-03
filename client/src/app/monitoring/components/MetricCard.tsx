"use client";
import React, { useEffect } from "react";
// 1. IMPORT MOTION COMPONENTS
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: number | string;
  sub: string;
  border: string;
  color: string;
}

export default function MetricCard({
  label,
  value,
  sub,
  border,
  color,
}: MetricCardProps) {
  // 2. COUNTER LOGIC
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    // I-a-animate natin ang value mula 0 hanggang sa 'value' prop
    const numericValue = typeof value === "string" ? parseInt(value) : value;
    
    if (!isNaN(numericValue)) {
      const controls = animate(count, numericValue, {
        duration: 1.5, // Bagalan natin konti para kitang-kita sa review
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [value, count]);

  return (
    <motion.div
      // 3. ENTRANCE ANIMATION (Para sumunod sa staggered effect ng page.tsx)
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }} // Dagdag na UX lift on hover
      className={`p-6 sm:p-8 bg-white border ${border} rounded-2xl shadow-sm flex flex-col items-center justify-center text-center transition-all`}
    >
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 sm:mb-3">
        {label}
      </span>
      
      {/* 4. ANIMATED VALUE */}
      <motion.span
        className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none ${color}`}
      >
        {typeof value === "number" ? rounded : value}
      </motion.span>

      <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest">
        {sub}
      </p>
    </motion.div>
  );
}