import React from "react";
import { motion } from "framer-motion";
import { formatTicketNumber } from "../../lib/ticketFormatter";

interface Ticket {
  globalId: string | number;
  displayId: string;
  ticket_number?: number;
  title: string;
  user: string;
  status: string;
}

interface TicketListProps {
  tickets: Ticket[];
  activeTicket: Ticket | null;
  onSelect: (ticket: Ticket) => void;
  onClose: () => void;
}

export const TicketList = ({ tickets, activeTicket, onSelect, onClose }: TicketListProps) => {
  // Helper para sa status colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'text-blue-600 bg-blue-50';
      case 'finished':
      case 'closed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      // Itinaas ang z-index sa 50 at dinagdagan ng backdrop blur para sa premium feel
      className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl border-x border-b border-gray-100 z-50 max-h-[320px] overflow-y-auto"
    >
      <div className="p-2 space-y-1">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[11px] text-gray-400 italic">No tickets available</p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.globalId}
              onClick={() => {
                onSelect(t);
                onClose();
              }}
              className={`p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                activeTicket?.globalId === t.globalId
                  ? "bg-green-50 border-l-4 border-green-600 shadow-sm"
                  : "hover:bg-gray-50 border-l-4 border-transparent"
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {t.ticket_number ? formatTicketNumber(t.ticket_number) : t.displayId}
                </span>
                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${getStatusColor(t.status)}`}>
                  {t.status}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-gray-800 truncate leading-tight">
                {t.title}
              </h4>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[9px] text-gray-400">
                  By: <span className="font-medium text-gray-600">{t.user}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};