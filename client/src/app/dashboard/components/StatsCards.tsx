"use client";

import { useRouter } from "next/navigation";
import { Bell, Calendar as CalendarIcon, BarChart3, ArrowRight, CheckCircle, CheckSquare } from "lucide-react";

export default function StatsCards({ remindersCount, pendingCount, inProgressCount, resolvedCount, finishedCount }: any) {
  const router = useRouter();

  const cards = [
    { label: "Reminders", count: remindersCount, filter: "Reminders", desc: "Needs urgent update", icon: <Bell size={18} /> },
    { label: "Pending", count: pendingCount, filter: "Pending", desc: "Awaiting reply", icon: <CalendarIcon size={18} /> },
    { label: "In-Progress", count: inProgressCount, filter: "In Progress", desc: "Currently in work", icon: <BarChart3 size={18} /> },
    { label: "Resolved", count: resolvedCount, filter: "Resolved", desc: "Fixed (Check if okay)", icon: <CheckCircle size={18} /> },
    { label: "Finished", count: finishedCount, filter: "Finished", desc: "Completed & Closed", icon: <CheckSquare size={18} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
      {cards.map((card, i) => (
        <div
          key={card.label}
          onClick={() => router.push(`/tickets?filter=${card.filter}&glow=true`)}
          className={`group relative bg-white p-6 rounded-2xl border border-slate-200/70 border-t-[5px] border-t-[#0A7848] shadow-sm transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] animate-slideUpFade
            ${card.label === "Reminders" ? "hover:border-t-amber-500 hover:text-amber-500" : ""}
            ${card.label === "Pending" ? "hover:border-t-blue-500 hover:text-blue-500" : ""}
            ${card.label === "In-Progress" ? "hover:border-t-yellow-600 hover:text-yellow-600" : ""}
            ${card.label === "Resolved" ? "hover:border-t-emerald-500 hover:text-emerald-500" : ""}
            ${card.label === "Finished" ? "hover:border-t-slate-600 hover:text-slate-600" : ""}
          `}
          style={{
            animationDelay: `${0.05 * (i + 1)}s`,
            animationFillMode: "both",
          }}
        >
          {/* Icon Wrapper */}
          <div className={`w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 
            ${card.label === "Reminders" ? "group-hover:bg-amber-50" : ""}
            ${card.label === "Pending" ? "group-hover:bg-blue-50" : ""}
            ${card.label === "In-Progress" ? "group-hover:bg-yellow-50" : ""}
            ${card.label === "Resolved" ? "group-hover:bg-emerald-50" : ""}
            ${card.label === "Finished" ? "group-hover:bg-slate-100" : ""}
          `}>
            <div className={`text-[#0A7848] transition-colors duration-300 
              ${card.label === "Reminders" ? "group-hover:text-amber-500 animate-wiggle" : ""}
              ${card.label === "Pending" ? "group-hover:text-blue-500" : ""}
              ${card.label === "In-Progress" ? "group-hover:text-yellow-600" : ""}
              ${card.label === "Resolved" ? "group-hover:text-emerald-500" : ""}
              ${card.label === "Finished" ? "group-hover:text-slate-600" : ""}
            `}>
              {card.icon}
            </div>
          </div>

          {/* Metrics Content */}
          <h3 className={`text-4xl font-black text-slate-900 transition-colors duration-300 
            ${card.label === "Reminders" ? "group-hover:text-amber-500" : 
              card.label === "Pending" ? "group-hover:text-blue-500" : 
              card.label === "In-Progress" ? "group-hover:text-yellow-600" : 
              card.label === "Resolved" ? "group-hover:text-emerald-500" : 
              "group-hover:text-slate-600"}`}>
            {card.count}
          </h3>
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{card.label}</p>
          <p className="text-[11px] font-medium text-slate-400 mb-4">{card.desc}</p>

          {/* Action text */}
          <div className={`flex items-center gap-1.5 text-[10px] font-bold text-[#0A7848] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0
             ${card.label === "Reminders" ? "group-hover:text-amber-500" : 
               card.label === "Pending" ? "group-hover:text-blue-500" : 
               card.label === "In-Progress" ? "group-hover:text-yellow-600" : 
               card.label === "Resolved" ? "group-hover:text-emerald-500" : 
               "group-hover:text-slate-600"}`}>
             <span>View List</span> <ArrowRight size={12} />
          </div>
        </div>
      ))}
    </div>
  );
}