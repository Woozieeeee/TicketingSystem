"use client";

import React from "react";
import { CheckCircle, PlayCircle, Bell, MoreVertical } from "lucide-react";
import type { Ticket, User, DeptAccent } from "../types/tickets";

interface TicketRowProps {
  ticket: Ticket;
  user: User;
  highlightId: string | null;
  isGroupGlowing: boolean;
  activeTab: string;
  onSelect: (ticket: Ticket) => void;
  onAction: (id: string | number, payload: any) => void;
  onRemind: (id: string | number) => void;
  onEdit: (ticket: Ticket) => void;
  getStatusData: (status: string) => { bg: string; border: string; text: string; dot: string };
  deptAccent: DeptAccent;
}

const TicketRow: React.FC<TicketRowProps> = ({
  ticket,
  user,
  highlightId,
  isGroupGlowing,
  activeTab,
  onSelect,
  onAction,
  onRemind,
  onEdit,
  getStatusData,
  deptAccent,
}) => {
  const isHighlighted = highlightId === String(ticket.globalId);
  const hasIConfirmed =
    (user.role === "User" && ticket.userMarkedDone) ||
    (user.role === "Head" && ticket.headMarkedDone);
  const isReminded = ticket.status === "Pending" && ticket.reminder_flag;

  // Logic from the main page
  const displayStatus = isReminded ? "Reminded" : ticket.status;
  const statusData = getStatusData(displayStatus);

  let rowAnimationClass = "";
  let borderClass = "border-l-transparent";

  if (isHighlighted) {
    rowAnimationClass = "animate-highlightPulse";
    borderClass = "border-l-teal-500";
  } else if (isGroupGlowing) {
    if (activeTab === "Reminders") {
      rowAnimationClass = "animate-glowRose";
      borderClass = "border-l-rose-500";
    } else if (activeTab === "Pending") {
      rowAnimationClass = "animate-glowAmber";
      borderClass = "border-l-amber-500";
    } else if (activeTab === "In Progress") {
      rowAnimationClass = "animate-glowIndigo";
      borderClass = "border-l-indigo-500";
    } else if (activeTab === "Resolved") {
      rowAnimationClass = "animate-glowGreen";
      borderClass = "border-l-emerald-500";
    } else if (activeTab === "Finished") {
      rowAnimationClass = "animate-glowCyan";
      borderClass = "border-l-cyan-500";
    } else {
      rowAnimationClass = "animate-glowSlate";
      borderClass = "border-l-slate-400";
    }
  } else if (isReminded) {
    borderClass = "border-l-rose-500";
  }

  return (
    <tr
      id={`ticket-${ticket.globalId}`}
      onClick={() => onSelect(ticket)}
      className={`group transition-all duration-300 cursor-pointer border-l-[3px] hover:bg-slate-50 ${borderClass} ${rowAnimationClass} ${
        hasIConfirmed && ticket.status === "Resolved" ? "opacity-60 bg-slate-50/50" : ""
      }`}
    >
      {user.role === "Head" && (
        <td className="px-2 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-col">
            <span className="text-[8.5px] sm:text-sm font-black text-slate-800">
              {ticket.createdBy}
            </span>
            <span className="text-[7.5px] sm:text-[10px] font-bold text-slate-400">
              #{ticket.id}
            </span>
          </div>
        </td>
      )}
      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-slate-100 text-slate-500 text-[7px] sm:text-[10px] font-black uppercase tracking-widest">
          {ticket.category?.slice(0, 8)}
          {ticket.category && ticket.category.length > 8 ? "..." : ""}
        </span>
      </td>
      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col max-w-[85px] sm:max-w-[200px]">
          <span className="text-[9px] sm:text-sm font-black text-slate-800 truncate">
            {ticket.title}
          </span>
          {user.role !== "Head" && (
            <span className="text-[7.5px] sm:text-[10px] font-bold text-slate-400 mt-0.5">
              #{ticket.id}
            </span>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border text-[7px] sm:text-[9px] font-black uppercase tracking-widest ${statusData.bg} ${statusData.border} ${statusData.text}`}
          >
            <span
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusData.dot }}
            />
            <span className="truncate max-w-[45px] sm:max-w-none">
              {displayStatus}
            </span>
          </span>
        </div>
      </td>
      <td className="px-2 sm:px-6 py-2.5 sm:py-3 text-[8px] sm:text-xs font-bold text-slate-500">
        {new Date(ticket.date).toLocaleDateString()}
      </td>
      <td
        className="px-2 sm:px-6 py-2.5 sm:py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {user.role === "Head" && ticket.status === "Pending" && (
            <button
              onClick={() => onAction(ticket.globalId, { status: "In Progress" })}
              className="p-1.5 rounded-lg text-white shadow-sm transition-all active:scale-90"
              style={{ backgroundColor: deptAccent.color }}
              title="Start Work"
            >
              <PlayCircle size={14} />
            </button>
          )}

          {user.role === "Head" &&
            (ticket.status === "In Progress" || ticket.status === "Resolved") &&
            !ticket.headMarkedDone && (
              <button
                onClick={() => onAction(ticket.globalId, { headMarkedDone: true })}
                className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm transition-all active:scale-90"
                title="Resolve"
              >
                <CheckCircle size={14} />
              </button>
            )}

          {user.role === "User" && ticket.status === "Pending" && (
            <>
              <button
                onClick={() => onRemind(ticket.globalId)}
                className={`p-1.5 rounded-lg shadow-sm transition-all active:scale-90 ${
                  ticket.reminder_flag
                    ? "bg-rose-100 text-rose-500 cursor-not-allowed"
                    : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                }`}
                disabled={ticket.reminder_flag}
                title="Send Reminder"
              >
                <Bell size={14} className={ticket.reminder_flag ? "animate-none" : "animate-pulse"} />
              </button>
              <button
                onClick={() => onEdit(ticket)}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shadow-sm hover:bg-slate-200"
              >
                <MoreVertical size={14} />
              </button>
            </>
          )}

          {user.role === "User" &&
            (ticket.status === "In Progress" || ticket.status === "Resolved") &&
            !ticket.userMarkedDone && (
              <button
                onClick={() => onAction(ticket.globalId, { userMarkedDone: true })}
                className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm transition-all active:scale-90"
                title="Confirm Done"
              >
                <CheckCircle size={14} />
              </button>
            )}
        </div>
      </td>
    </tr>
  );
};

export default TicketRow;