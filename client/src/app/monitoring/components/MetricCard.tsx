"use client";
import React from "react";

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
  return (
    <div
      className={`p-6 sm:p-8 bg-white border ${border} rounded-2xl shadow-sm flex flex-col items-center justify-center text-center transition-all`}
    >
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 sm:mb-3">
        {label}
      </span>
      <span
        className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none ${color}`}
      >
        {value}
      </span>
      <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest">
        {sub}
      </p>
    </div>
  );
}