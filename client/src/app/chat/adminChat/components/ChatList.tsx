"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Ticket {
  globalId: string;
  id: number;
  title: string;
  user: string;
  status: string;
  department: string;
  category: string;
  date: string;
  preview: string;
  updatedAt: string;
  reminder_flag: number;
  unreadCount: number;
  isTyping?: boolean;
}

interface ChatListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  activeTab: "active" | "archived";
  setActiveTab: (tab: "active" | "archived") => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Finished":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const ChatList: React.FC<ChatListProps> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  activeTab,
  setActiveTab,
  setSelectedTicket,
}) => {
  const router = useRouter();

  const displayedTickets = tickets
    .filter((t) =>
      activeTab === "active"
        ? t.status !== "Finished"
        : t.status === "Finished"
    )
    .sort((a, b) => {
      if (activeTab === "active") {
        const aHasReminder = a.reminder_flag === 1 && a.status !== "In Progress";
        const bHasReminder = b.reminder_flag === 1 && b.status !== "In Progress";

        if (aHasReminder && !bHasReminder) return -1;
        if (!aHasReminder && bHasReminder) return 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div
      className={`${
        selectedTicket ? "hidden md:flex" : "flex"
      } w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col flex-shrink-0 z-20`}
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-900 bg-slate-800 text-white shadow-sm z-10 flex-shrink-0">
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
              Admin Support
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Manage Tickets
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 border-b border-slate-200 p-2 gap-2 shadow-inner flex-shrink-0">
        <button
          onClick={() => {
            setActiveTab("active");
            setSelectedTicket(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === "active"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => {
            setActiveTab("archived");
            setSelectedTicket(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
            activeTab === "archived"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          }`}
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
                    ? "bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                    : "bg-white border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                {/* Badge */}
                {showBadge && (
                  <div
                    className={`absolute -top-2 -right-1 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white z-20 shadow-md cursor-help ${
                      showReminder && !showUnread
                        ? "bg-[#ef4444] animate-highlight"
                        : "bg-[#6366f1]"
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
                      className={`text-sm font-bold truncate ${
                        selectedTicket?.globalId === ticket.globalId
                          ? "text-indigo-700"
                          : "text-slate-800"
                      }`}
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

                {/* User & Department */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 truncate">
                    <span className="font-semibold text-slate-600">{ticket.user}</span>
                    {ticket.department && (
                      <span className="text-slate-400"> • {ticket.department}</span>
                    )}
                  </p>
                  {ticket.isTyping && (
                    <span className="text-[10px] text-indigo-500 font-semibold animate-pulse flex-shrink-0 ml-2">
                      typing...
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
