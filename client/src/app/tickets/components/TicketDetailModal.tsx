"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Clock, User as UserIcon, Tag, Calendar } from "lucide-react";
import type { Ticket, DeptAccent } from "../types/tickets";
import { formatTicketNumber } from "../../../lib/ticketFormatter";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  deptAccent: DeptAccent;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  deptAccent,
}) => {
  if (!ticket) return null;

  // Logic para sa Status Badge sa loob ng Modal
  const isReminded = ticket.status === "Pending" && ticket.reminder_flag;
  const displayStatus = isReminded ? "Reminded" : ticket.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Reminded": return "bg-rose-500 text-white";
      case "Pending": return "bg-amber-500 text-white";
      case "In Progress": return "bg-indigo-500 text-white";
      case "Resolved": return "bg-emerald-500 text-white";
      case "Finished": return "bg-cyan-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div 
          className="px-6 py-5 flex items-center justify-between text-white shadow-lg"
          style={{ backgroundColor: deptAccent.color }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm ${getStatusColor(displayStatus)}`}>
                {displayStatus}
              </span>
              <h2 className="text-lg font-black tracking-tight leading-none uppercase">Ticket Details</h2>
            </div>
            <span className="text-white/80 text-[10px] font-bold tracking-widest uppercase">
              {ticket.ticket_number ? formatTicketNumber(ticket.ticket_number) : `Reference #${ticket.id}`}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition-colors active:scale-90"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-6">
            {/* Title & Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><UserIcon size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested By</p>
                  <p className="text-sm font-bold text-slate-800">{ticket.createdBy}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Tag size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                  <p className="text-sm font-bold text-slate-800">{ticket.category || "General"}</p>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Subject
              </p>
              <h3 className="text-lg font-black text-slate-900 leading-tight">{ticket.title}</h3>
            </div>

            {/* Description */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm min-h-[120px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Detailed Description
              </p>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium break-words overflow-hidden">
                {ticket.description || "No additional details provided."}
              </div>
            </div>

            {/* Meta Data */}
            <div className="flex flex-wrap gap-4 px-2">
               <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} />
                  <span className="text-[11px] font-bold">Created: {new Date(ticket.date).toLocaleString()}</span>
               </div>
               {ticket.lastUpdated && (
                 <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[11px] font-bold italic text-[9px]">Last Update: {new Date(ticket.lastUpdated).toLocaleTimeString()}</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-sm transition-all active:scale-95"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TicketDetailModal;