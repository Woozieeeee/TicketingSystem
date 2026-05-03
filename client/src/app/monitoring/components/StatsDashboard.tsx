"use client";
import React from "react";
import MetricCard from "./MetricCard";
// 1. DAGDAGAN ANG MOTION
import { motion } from "framer-motion"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ShieldCheck, Download } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
}

interface StatsDashboardProps {
  selectedUser: TeamMember;
  currentStats: {
    pending: number;
    ongoing: number;
    resolved: number;
  };
  timeRange: string;
  setTimeRange: (range: string) => void;
}

export default function StatsDashboard({
  selectedUser,
  currentStats,
  timeRange,
  setTimeRange,
}: StatsDashboardProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          label="Pending"
          value={currentStats.pending}
          sub="Backlog"
          color="text-slate-500"
          border="border-slate-200"
        />
        <MetricCard
          label="Ongoing"
          value={currentStats.ongoing}
          sub="In Progress"
          color="text-amber-500"
          border="border-amber-200"
        />
        <MetricCard
          label="Resolved"
          value={currentStats.resolved}
          sub="Completed"
          color="text-emerald-500"
          border="border-emerald-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 2. CHART SECTION WITH ENTRANCE ANIMATION */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-slate-200 p-5 sm:p-8 rounded-2xl shadow-sm flex flex-col min-h-[350px] sm:min-h-0"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight uppercase">
              Performance Chart
            </h3>
            <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
              {["Today", "Weekly", "Monthly"].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                    timeRange === r
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "BACKLOG", val: currentStats.pending },
                  { name: "PROGRESS", val: currentStats.ongoing },
                  { name: "RESOLVED", val: currentStats.resolved },
                ]}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                {/* 3. CHART GROWTH ANIMATION - isAnimationActive at animationDuration */}
                <Bar 
                  dataKey="val" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={60}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={300}
                >
                  <Cell fill="#cbd5e1" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4. INFO PANEL WITH SLIDE-IN FROM RIGHT */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none" />
          <div className="relative z-10 mb-8 lg:mb-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 sm:mb-6">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600">
                Verified Personnel
              </span>
            </div>
            <h4 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
              Log: <br className="hidden lg:block" />
              <span className="text-emerald-600">
                {selectedUser.name}
              </span>
            </h4>
            <p className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider leading-relaxed">
              User is currently managing {currentStats.ongoing} active
              tickets. Efficiency rating is stable at 94.2% for the
              current {timeRange.toLowerCase()} cycle.
            </p>
          </div>
          <button className="relative z-10 w-full py-3 sm:py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs tracking-widest transition-all uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md">
            <Download size={14} /> Export Dataset
          </button>
        </motion.div>
      </div>
    </div>
  );
}