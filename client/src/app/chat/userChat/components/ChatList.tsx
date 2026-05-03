"use client";

import React from "react";
import { getStatusColor } from "./CustomStyles";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Ticket {
  globalId: string;
  id: number;
  title: string;
  status: string;
  preview: string;
  category: string;
  senderName: string;
  department: string;
  date: string;
  updatedAt: string;
  reminder_flag: number;
  unreadCount: number;
  isTyping: boolean;
}

interface ChatListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  activeTab: "active" | "archived";
  onSelectTicket: (ticket: Ticket) => void;
  onSetActiveTab: (tab: "active" | "archived") => void;
}

export default function ChatList({
  tickets,
  selectedTicket,
  activeTab,
  onSelectTicket,
  onSetActiveTab,
}: ChatListProps) {
  const displayedTickets = tickets
    .filter((t) =>
      activeTab === "active"
        ? t.status !== "Finished"
        : t.status === "Finished",
    )
    .sort((a, b) => {
      if (activeTab === "active") {
        if (a.reminder_flag && !b.reminder_flag) return -1;
        if (!a.reminder_flag && b.reminder_flag) return 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
const router = useRouter();
  return (
    <div
      className={`${selectedTicket ? "hidden md:flex" : "flex"} w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col flex-shrink-0 z-20`}
    >
   {/* Header */}
<div className="p-4 md:p-5 border-b border-green-800 bg-green-700 text-white shadow-sm z-10 flex-shrink-0">
  <div className="flex items-center gap-3">
    <button
      onClick={() => router.push("/dashboard")}
      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
      title="Back to dashboard"
    >
      <ArrowLeft size={18} />
    </button>
    <div>
      <h1 className="font-black text-lg md:text-xl tracking-tight">
        My Support
      </h1>
      <p className="text-[10px] text-green-200 uppercase tracking-widest font-semibold mt-0.5">
        Ticket History
      </p>
    </div>
  </div>
</div>

      {/* Tabs */}
      <div className="flex bg-slate-100 border-b border-slate-200 p-2 gap-2 shadow-inner flex-shrink-0">
        <button
          onClick={() => {
            onSetActiveTab("active");
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "active" ? "bg-white text-green-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
        >
          Active
        </button>
        <button
          onClick={() => {
            onSetActiveTab("archived");
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "archived" ? "bg-white text-slate-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
        >
          Archive
        </button>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 smooth-scroll">
        {displayedTickets.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center opacity-60">
            <span className="text-sm font-semibold text-slate-500">
              No tickets found
            </span>
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const showReminder = ticket.reminder_flag === 1;
            const showUnread = ticket.unreadCount > 0;
            const showBadge =
              (showReminder || showUnread) && activeTab === "active";

            return (
              <div
                key={ticket.globalId}
                onClick={() => onSelectTicket(ticket)}
                className={`custom-ticket-item group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-visible ${
                  selectedTicket?.globalId === ticket.globalId
                    ? "bg-white border-green-500 shadow-md ring-1 ring-green-500/20"
                    : "bg-white border-slate-200 shadow-sm hover:border-green-300 hover:shadow-md"
                }`}
              >
                {/* Badge */}
                {showBadge && (
                  <div
                    className={`absolute -top-2 -right-1 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white z-20 shadow-md cursor-help ${
                      showReminder && !showUnread
                        ? "bg-[#ef4444] animate-highlight"
                        : "bg-[#16a34a]"
                    }`}
                    style={{ border: "2px solid white" }}
                  >
                    {showUnread ? ticket.unreadCount : "!"}

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[999] animate-popOut pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap font-bold border border-slate-700">
                        {showUnread
                          ? `${ticket.unreadCount} New Messages`
                          : "Reminder Sent"}
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                    </div>
                  </div>
                )}

                {/* Ticket Info */}
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <span className="text-[10px] font-black text-slate-400 mr-1.5 flex-shrink-0">
                      #{ticket.id}
                    </span>
                    <h3
                      className={`text-sm font-bold truncate ${selectedTicket?.globalId === ticket.globalId ? "text-green-700" : "text-slate-800"}`}
                    >
                      {ticket.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border flex-shrink-0 ${getStatusColor(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
