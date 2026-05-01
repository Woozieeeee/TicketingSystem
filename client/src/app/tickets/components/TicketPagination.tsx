"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TicketPaginationProps {
  currentPage: number;
  totalPages: number;
  ticketsPerPage: number;
  totalTickets: number;
  indexOfFirstTicket: number;
  indexOfLastTicket: number;
  onPageChange: (page: number) => void;
  onTicketsPerPageChange: (value: number) => void;
}

export default function TicketPagination({
  currentPage,
  totalPages,
  ticketsPerPage,
  totalTickets,
  indexOfFirstTicket,
  indexOfLastTicket,
  onPageChange,
  onTicketsPerPageChange,
}: TicketPaginationProps) {
  return (
    <div className="px-3 py-2 sm:px-6 sm:py-4 border-t border-slate-200 flex flex-row items-center justify-between gap-1 bg-slate-50/50 w-full box-border rounded-none sm:rounded-b-xl overflow-hidden">
      <div className="text-[9px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap flex-shrink-0">
        {indexOfFirstTicket + 1}-
        {Math.min(indexOfLastTicket, totalTickets)}{" "}
        <span className="hidden sm:inline">of {totalTickets}</span>
      </div>
      <div className="flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full p-0.5 sm:p-1 flex-shrink-0 mx-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-1 sm:px-2 text-teal-600 hover:text-teal-700 disabled:opacity-40"
        >
          <ChevronLeft size={14} strokeWidth={3} />
        </button>
        <div className="flex items-center px-1">
          <button className="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-[12px] font-bold bg-teal-500 text-white shadow-sm">
            {currentPage}
          </button>
        </div>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-1 sm:px-2 text-teal-600 hover:text-teal-700 disabled:opacity-40"
        >
          <ChevronRight size={14} strokeWidth={3} />
        </button>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[9px] sm:text-xs font-bold text-slate-500 hidden sm:inline">
          Rows:
        </span>
        <select
          value={ticketsPerPage}
          onChange={(e) => onTicketsPerPageChange(Number(e.target.value))}
          className="p-0.5 sm:p-1 border border-slate-200 rounded bg-white text-[9px] sm:text-xs font-bold text-slate-600 outline-none cursor-pointer shadow-sm"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  );
}
