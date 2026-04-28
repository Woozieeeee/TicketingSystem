import React from "react";
import { AnimatePresence } from "framer-motion";
import { TicketList } from "./TicketList";

interface ChatHeaderProps {
  activeTicket: any;
  showTicketList: boolean;
  setShowTicketList: (show: boolean) => void;
  setIsOpen: (open: boolean) => void;
  tickets: any[];
  setActiveTicket: (ticket: any) => void;
}

export const ChatHeader = ({ 
  activeTicket, 
  showTicketList, 
  setShowTicketList, 
  setIsOpen, 
  tickets, 
  setActiveTicket 
}: ChatHeaderProps) => {
  return (
    <div className="relative p-4 bg-green-700 text-white flex justify-between items-center shadow-lg z-20">
      {/* Ticket Selection Area */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-green-800 p-1.5 rounded-xl transition-all active:scale-95 flex-1 min-w-0"
        onClick={() => setShowTicketList(!showTicketList)}
      >
        <div className="bg-white/20 p-1.5 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-xs flex items-center gap-1 uppercase tracking-wider truncate">
            {activeTicket ? activeTicket.displayId : "Select Ticket"}
            <span className="text-[10px] opacity-70">{showTicketList ? '▲' : '▼'}</span>
          </h3>
          {activeTicket && (
            <p className="text-[10px] opacity-90 font-medium truncate">
              User: {activeTicket.user}
            </p>
          )}
        </div>
      </div>
      
      {/* Close Button */}
      <button 
        onClick={() => setIsOpen(false)} 
        className="hover:bg-red-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-2xl font-light"
      >
        ×
      </button>

      {/* Ticket List Overlay */}
      <AnimatePresence>
        {showTicketList && (
          <TicketList 
            tickets={tickets} 
            activeTicket={activeTicket} 
            onSelect={(ticket) => {
              setActiveTicket(ticket);
              setShowTicketList(false);
            }} 
            onClose={() => setShowTicketList(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};