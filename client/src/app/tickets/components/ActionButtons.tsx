"use client";

import { Bell, CheckCircle, PlayCircle } from "lucide-react";
import type { Ticket, User, DeptAccent } from "../types/tickets";

interface ActionButtonsProps {
  ticket: Ticket;
  user: User;
  onAction: (globalId: string | number, payload: any) => void;
  onEdit: (ticket: Ticket) => void;
  onRemind: (globalId: string | number) => void;
  deptAccent?: DeptAccent;
}

export default function ActionButtons({
  ticket,
  user,
  onAction,
  onEdit,
  onRemind,
  deptAccent,
}: ActionButtonsProps) {
  const minutesPast =
    (new Date().getTime() - new Date(ticket.date).getTime()) / 60000;

  return (
    <div className="flex gap-1 sm:gap-2 items-center justify-end">
     {/* USER ACTIONS: Edit, Nudge, and Confirm Done */}
{user?.role === "User" &&
  String(ticket.createdBy) === String(user?.username) && (
    <div className="flex gap-1 sm:gap-2"> {/* Wrapper for alignment */}
      
      {/* 1. LALABAS LANG PAG PENDING */}
      {ticket.status === "Pending" && (
        <>
          <button
            className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ticket);
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="sm:w-3 sm:h-3">
              <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>

          {ticket.reminder_flag ? (
            <span className="text-[7px] sm:text-[9px] text-rose-500 font-bold px-1 sm:px-2 py-0.5 bg-rose-50 rounded border border-rose-200">
              Reminded
            </span>
          ) : minutesPast >= 5 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemind(ticket.globalId);
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 border border-amber-300 text-amber-600 rounded font-black text-[7px] sm:text-[9px] uppercase tracking-widest"
            >
              <Bell size={8} className="sm:w-2.5 sm:h-2.5" />
              <span className="hidden sm:inline">Nudge</span>
            </button>
          ) : null}
        </>
      )}

      {/* 2. only appeared when ticket is RESOLVED ( labas ng Pending block) */}
      {ticket.status === "Resolved" && !ticket.userMarkedDone && (
        <button 
          className="flex items-center gap-0.5 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest bg-blue-500 hover:bg-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAction(ticket.globalId, { userMarkedDone: true });
          }}
        >
          <CheckCircle size={8} className="sm:w-2.5 sm:h-2.5" />
          <span>Confirm Done</span>
        </button>
      )}
    </div>
)}

      {/* HEAD ACTIONS: Accept and Resolve only */}
      {user?.role === "Head" && (
        <>
          {/* if pending, only accept button will show */}
          {ticket.status === "Pending" && (
            <button
              className="flex items-center gap-0.5 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest"
              style={{ backgroundColor: deptAccent?.color || "#16a34a" }}
              onClick={(e) => {
                e.stopPropagation();
                onAction(ticket.globalId, { status: "In Progress" });
              }}
            >
              <PlayCircle size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
              <span>Accept</span>
            </button>
          )}

          {/* if In Progress, Follow Up at Resolve lang ang button */}
          {ticket.status === "In Progress" && (
            <>
              

              <button
                className="flex items-center gap-0.5 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(ticket.globalId, { status: "Resolved" });
                }}
              >
                <CheckCircle size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
                <span>Resolve</span>
              </button>
            </>
          )}

          {/*  Confirm Button, it will show or appeared if tickets are RESOLVED*/}
          
          {ticket.status === "Resolved" && !ticket.headMarkedDone && (
  <>
    <button
      className="flex items-center gap-0.5 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest bg-amber-500 hover:bg-amber-600 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        // for now it will change in "Follow Up" of "Pending"
        onAction(ticket.globalId, { status: "Pending" });
      }}
    >
      <Bell size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
      <span>Follow Up</span>
    </button>
            <button
              className="flex items-center gap-0.5 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onAction(ticket.globalId, { headMarkedDone: true, });
              }}
            >
              <CheckCircle size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
              <span>Finish</span>
            </button>
            </>
            
          )}
        </>
      )}
    </div>
  );
}