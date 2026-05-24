"use client";

import { useRouter } from "next/navigation";
import { 
  Bell, 
  Calendar as CalendarIcon, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  CheckSquare,
  Star
} from "lucide-react";

interface StatsCardsProps {
  remindersCount: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  finishedCount: number;
  averageRating?: number;
  totalReviews?: number;
}

export default function StatsCards({
  remindersCount,
  pendingCount,
  inProgressCount,
  resolvedCount,
  finishedCount,
  averageRating = 0,
  totalReviews = 0,
}: StatsCardsProps) {
  const router = useRouter();

  // Explicitly mapping Tailwind color classes ensures they compile correctly
  const cards = [
    {
      label: "Reminders",
      count: remindersCount,
      bgIcon: "bg-rose-50",
      textIcon: "text-rose-500",
      borderTop: "border-t-rose-500",
      bgHoverStrip: "bg-rose-500",
      desc: "Needs urgent update",
      filter: "Reminders",
    },
    {
      label: "Pending",
      count: pendingCount,
      bgIcon: "bg-amber-50",
      textIcon: "text-amber-500",
      borderTop: "border-t-amber-500",
      bgHoverStrip: "bg-amber-500",
      desc: "Awaiting reply",
      filter: "Pending",
    },
    {
      label: "In-Progress",
      count: inProgressCount,
      bgIcon: "bg-indigo-50",
      textIcon: "text-indigo-500",
      borderTop: "border-t-indigo-500",
      bgHoverStrip: "bg-indigo-500",
      desc: "Currently in work",
      filter: "In Progress",
    },
    {
      label: "Resolved",
      count: resolvedCount,
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-500",
      borderTop: "border-t-emerald-500",
      bgHoverStrip: "bg-emerald-500",
      desc: "Fixed (Check if okay)",
      filter: "Resolved",
    },
    {
      label: "Finished",
      count: finishedCount,
      bgIcon: "bg-cyan-50",
      textIcon: "text-cyan-500",
      borderTop: "border-t-cyan-500",
      bgHoverStrip: "bg-cyan-500",
      desc: "Completed & Closed",
      filter: "Finished",
    },
    {
      label: "Avg Rating",
      count: averageRating.toFixed(1),
      bgIcon: "bg-purple-50",
      textIcon: "text-purple-500",
      borderTop: "border-t-purple-500",
      bgHoverStrip: "bg-purple-500",
      desc: `${totalReviews} review${totalReviews !== 1 ? 's' : ''}`,
      filter: "Reviews",
      isRating: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-6">
      {cards.map((card, i) => {
        const isReminder = card.label === "Reminders";
        const isPending = card.label === "Pending";
        const isRatingCard = (card as any).isRating;

        // Modernized card base with smooth interactive scaling and shadow effects
        const baseClasses = "relative bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] animate-slideUpFade";
        
        // Conditional handling to preserve top border logic alongside custom rounded corners
        let borderModifier = "";
        if (isReminder || isPending) {
          borderModifier = `border-t-[5px] ${card.borderTop}`;
        }

        return (
          <div
            key={card.label}
            onClick={() => router.push(`/tickets?filter=${card.filter}&glow=true`)}
            className={`group ${baseClasses} ${borderModifier}`}
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
            {/* Elegant slide-in accent indicator line for In-Progress, Resolved, & Finished cards */}
            {!isReminder && !isPending && (
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${card.bgHoverStrip} group-hover:h-1.5 transition-all duration-300`}
              />
            )}

            {/* Icon Wrapper with a slight dynamic tilt on hover */}
            <div className={`w-10 h-10 rounded-xl ${card.bgIcon} flex items-center justify-center mb-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {i === 0 ? <Bell size={18} className={`${card.textIcon} animate-wiggle`} /> :
               i === 1 ? <CalendarIcon size={18} className={card.textIcon} /> :
               i === 2 ? <BarChart3 size={18} className={card.textIcon} /> :
               i === 3 ? <CheckCircle size={18} className={card.textIcon} /> :
               i === 4 ? <CheckSquare size={18} className={card.textIcon} /> :
               <Star size={18} className={card.textIcon} />}
            </div>

            {/* Metrics Content */}
            <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-1.5 group-hover:text-black transition-colors">
              {card.count}
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              {card.label}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mb-4 whitespace-nowrap">
              {card.desc}
            </p>

            {/* Action text linking animation */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-4px] group-hover:translate-x-0">
              <span>View List</span> 
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}