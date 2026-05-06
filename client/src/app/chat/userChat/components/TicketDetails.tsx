"use client";

import React from "react";
import { X } from "lucide-react";
import { getStatusColor } from "./CustomStyles";

interface Ticket {
  globalId: string;
  id: string;
  title: string;
  status: string;
  category: string;
  date: string;
}

interface TicketDetailsProps {
  selectedTicket: Ticket | null;
  isInfoOpen: boolean;
  onCloseInfo: () => void;
}

export default function TicketDetails({
  selectedTicket,
  isInfoOpen,
  onCloseInfo,
}: TicketDetailsProps) {
  if (!selectedTicket) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[50] xl:hidden"
          onClick={onCloseInfo}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[200px] bg-white z-[60] transition-transform duration-300 ease-in-out shadow-2xl ${
          isInfoOpen ? "translate-x-0" : "translate-x-full"
        } xl:static xl:translate-x-0 xl:flex xl:flex-col xl:w-72 xl:border-l xl:border-slate-200 xl:bg-white xl:shadow-none`}
      >
        <div className="p-5 h-full overflow-y-auto">
          {/* Mobile Header with Close */}
          <div className="flex justify-between items-center mb-6 xl:hidden">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
              Information
            </h3>
            <button
              onClick={onCloseInfo}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Desktop Header */}
          <h3 className="hidden xl:block font-bold text-xs mb-6 text-slate-400 uppercase tracking-widest">
            Ticket Info
          </h3>

          {/* Info Fields */}
          <div className="space-y-5">
            {/* Status */}
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                Status
              </p>
              <span
                className={`inline-flex px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(selectedTicket.status)}`}
              >
                {selectedTicket.status}
              </span>
            </div>

            {/* Ticket ID */}
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Ticket ID
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                #{selectedTicket.id}
              </p>
            </div>

            {/* Category */}
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Category
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {selectedTicket.category}
              </p>
            </div>

            {/* Date Created */}
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Date Created
              </p>
              <p className="text-xs font-medium text-slate-700 mt-1">
                {selectedTicket.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
