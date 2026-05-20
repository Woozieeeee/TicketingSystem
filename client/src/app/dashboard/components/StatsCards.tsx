"use client";

import { useRouter } from "next/navigation";
import { 
  Bell, 
  Calendar as CalendarIcon, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  CheckSquare 
} from "lucide-react";

interface StatsCardsProps {
  remindersCount: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  finishedCount: number;
}

export default function StatsCards({
  remindersCount,
  pendingCount,
  inProgressCount,
  resolvedCount,
  finishedCount,
}: StatsCardsProps) {
  const router = useRouter();

  const cards = [
    {
      label: "Reminders",
      count: remindersCount,
      color: "rose",
      desc: "Needs urgent update",
      filter: "Reminders",
    },
    {
      label: "Pending",
      count: pendingCount,
      color: "amber",
      desc: "Awaiting reply",
      filter: "Pending",
    },
    {
      label: "In-Progress",
      count: inProgressCount,
      color: "indigo",
      desc: "Currently in work",
      filter: "In Progress",
    },
    {
      label: "Resolved",
      count: resolvedCount,
      color: "green",
      desc: "Fixed (Check if okay)",
      filter: "Resolved",
    },
    {
      label: "Finished",
      count: finishedCount,
      color: "cyan",
      desc: "Completed & Closed",
      filter: "Finished",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      {cards.map((card, i) => {
        const isReminder = card.label === "Reminders";
        const isPending = card.label === "Pending";

        // UI FIX: border logic of Reminder at Pending color
        let borderClasses =
          "border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 animate-slideUpFade";
        
        if (isReminder) {
          borderClasses = "border-x border-b border-slate-200 border-t-4 border-t-rose-500 shadow-sm hover:shadow-xl hover:-translate-y-1 animate-slideUpFade";
        } else if (isPending) {
          borderClasses = "border-x border-b border-slate-200 border-t-4 border-t-amber-500 shadow-sm hover:shadow-xl hover:-translate-y-1 animate-slideUpFade";
        }

        return (
          <div
            key={card.label}
            onClick={() => router.push(`/tickets?filter=${card.filter}&glow=true`)}
            className={`group card bg-white p-6 transition-all duration-300 cursor-pointer overflow-hidden ${borderClasses}`}
            style={
              isReminder
                ? {
                    animation: `slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 * (i + 1)}s both`,
                  }
                : {
                    animationDelay: `${0.05 * (i + 1)}s`,
                    animationFillMode: "both",
                  }
            }
          >
            {/* only appeard for 'In-Progress, Resolved, at Finished */}
            {!isReminder && !isPending && (
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-${card.color}-500 group-hover:h-1.5 transition-all`}
              />
            )}

            <div className={`w-10 h-10 rounded-lg bg-${card.color}-100 flex items-center justify-center mb-3.5 flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              {i === 0 ? <Bell size={18} className="text-rose-500 animate-wiggle" /> :
               i === 1 ? <CalendarIcon size={18} className="text-amber-500" /> :
               i === 2 ? <BarChart3 size={18} className="text-indigo-500" /> :
               i === 3 ? <CheckCircle size={18} className="text-green-500" /> : 
               <CheckSquare size={18} className="text-cyan-500" />}
            </div>

            <p className="text-4xl font-black text-slate-900 mb-2">
              {card.count}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className="text-[10px] text-slate-400 mb-3.5 whitespace-nowrap">
              {card.desc}
            </p>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
              View List <ArrowRight size={10} />
            </div>
          </div>
        );
      })}
    </div>
  );
}