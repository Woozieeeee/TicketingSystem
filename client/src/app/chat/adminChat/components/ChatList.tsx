"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types maintained from original ---
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

const ChatList: React.FC<ChatListProps> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  activeTab,
  setActiveTab,
  setSelectedTicket,
}) => {
  const router = useRouter();

  // Logic maintained: Filter and Sort exactly as original
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
      {/* Header Section */}
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

      {/* Tabs Section */}
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

      {/* Ticket List Rendering (To be continued in your logic) */}
      <div className="flex-1 overflow-y-auto smooth-scroll">
         {/* Mapping of displayedTickets would go here following your original UI pattern */}
      </div>
    </div>
  );
};

export default ChatList;