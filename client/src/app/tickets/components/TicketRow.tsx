"use client";

import React from "react";
import type { Ticket, User, DeptAccent } from "../types/tickets";
import ActionButtons from "./ActionButtons";

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
  isSelected: boolean;
  onSelectToggle: (globalId: string | number) => void;
  showCheckbox: boolean;
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
  isSelected,
  onSelectToggle,
  showCheckbox,
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
      className={`
        group cursor-pointer border-l-[4px] bg-white text-slate-700
        transition-all duration-300 ease-in-out
        hover:bg-slate-50/90 hover:scale-[1.01] hover:shadow-md hover:relative hover:z-10
        ${borderClass} 
        ${rowAnimationClass} 
        ${hasIConfirmed && ticket.status === "Resolved" ? "opacity-50 bg-slate-50/40" : ""} 
        ${isSelected ? "bg-rose-50/40 hover:bg-rose-50/60 border-l-rose-400" : ""}
      `}
    >
      {/* CHECKBOX SELECTION */}
      {showCheckbox && (
        <td className="px-3 sm:px-6 py-3 sm:py-4 alignment-middle" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectToggle(ticket.globalId)}
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded border-slate-300 text-rose-500 focus:ring-rose-400 focus:ring-offset-0 accent-rose-500 cursor-pointer transition-colors duration-150"
            />
          </div>
        </td>
      )}

      {/* CREATOR INFO (HEAD ROLE ONLY) */}
      {user.role === "Head" && (
        <td className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug group-hover:text-black">
              {ticket.createdBy}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wide font-mono">
              #{ticket.id}
            </span>
          </div>
        </td>
      )}

      {/* CATEGORY BADGE */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-100 text-slate-600 text-[9px] sm:text-xs font-bold uppercase tracking-wider shadow-sm border border-slate-200/50">
          {ticket.category?.slice(0, 8)}
          {ticket.category && ticket.category.length > 8 ? "..." : ""}
        </span>
      </td>

      {/* TICKET TITLE */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col max-w-[100px] sm:max-w-[260px] gap-0.5">
          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-black">
            {ticket.title}
          </span>
          {user.role !== "Head" && (
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 font-mono">
              #{ticket.id}
            </span>
          )}
        </div>
      </td>

      {/* TICKET STATUS BADGE */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border text-[9px] sm:text-xs font-bold uppercase tracking-wider shadow-sm ${statusData.bg} ${statusData.border} ${statusData.text}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-inner"
              style={{ background: statusData.dot }}
            />
            <span className="truncate max-w-[55px] sm:max-w-none">
              {displayStatus}
            </span>
          </span>
        </div>
      </td>

      {/* DATE COMPONENT */}
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-500 whitespace-nowrap">
        {new Date(ticket.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        })}
      </td>

      {/* ACTION BUTTON WRAPPER */}
      <td
        className="px-3 sm:px-6 py-3 sm:py-4 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex justify-end w-full">
          <ActionButtons
            ticket={ticket}
            user={user}
            onAction={onAction}
            onEdit={onEdit}
            onRemind={onRemind}
            deptAccent={deptAccent}
          />
        </div>
      </td>
    </tr>
  );
};

export default TicketRow;