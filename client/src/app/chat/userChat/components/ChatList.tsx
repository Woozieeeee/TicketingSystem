"use client";



import React from "react";

import { getStatusColor } from "./CustomStyles";

import { ArrowLeft } from "lucide-react";

import { useRouter } from "next/navigation";

import { formatTicketNumber } from "../../../../lib/ticketFormatter";



interface Ticket {

  globalId: string;

  id: string;

  ticket_number?: number;

  title: string;

  status: string;

  preview: string;

  category: string;

  createdBy: string;

  dept: string;

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

      className={`${selectedTicket ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white border-r border-amber-200 flex-col shadow-sm flex-shrink-0 z-20`}

    >

      {/* Header */}

      <div className="px-4 py-3 border-b border-black/5 bg-[#0A7848] text-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] z-10 flex-shrink-0">

        <div className="flex items-center gap-2 mb-1">

          <button

            onClick={() => router.push("/dashboard")}

            className="hover:bg-[#0A7848]/90 p-1 rounded-md transition-colors"

            title="Back to dashboard"

          >

            <ArrowLeft size={20} />

          </button>

          <h1 className="font-bold text-lg">My Support</h1>

        </div>

        <p className="text-[10px] text-white/80 uppercase tracking-widest ml-8">

          Ticket History

        </p>

      </div>



      {/* Tabs */}

      <div className="flex bg-green-50 border-b border-amber-200 p-2 gap-2 flex-shrink-0">

        <button

          onClick={() => onSetActiveTab("active")}

          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "active" ? "bg-white text-green-700 shadow-sm border border-amber-200" : "text-green-600 hover:bg-green-100"}`}

        >

          Active

        </button>

        <button

          onClick={() => onSetActiveTab("archived")}

          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "archived" ? "bg-white text-green-800 shadow-sm border border-amber-200" : "text-green-600 hover:bg-green-100"}`}

        >

          Archive

        </button>

      </div>



      {/* Ticket List */}

      <div className="flex-1 overflow-y-auto smooth-scroll">

        {displayedTickets.length === 0 ? (

          <div className="p-8 text-center">

            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">

              <span className="text-xl">🎫</span>

            </div>

            <p className="text-green-600 font-medium text-sm">

              No tickets found

            </p>

          </div>

        ) : (

          displayedTickets.map((ticket) => (

            <div

              key={ticket.globalId}

              onClick={() => onSelectTicket(ticket)}

              className={`p-4 border-b border-amber-100 cursor-pointer transition-colors ${

                selectedTicket?.globalId === ticket.globalId

                  ? "bg-green-50 border-l-4 border-l-green-600"

                  : "hover:bg-green-50"

              }`}

            >

              {/* ID + Status row */}

              <div className="flex justify-between items-center mb-1">

                <p className="font-bold text-sm text-green-800">{ticket.ticket_number ? formatTicketNumber(ticket.ticket_number) : `#${ticket.id}`}</p>

                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${

                  ticket.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'

                }`}>

                  {ticket.status}

                </span>

              </div>

              {/* User */}

              <p className="text-sm font-medium text-green-900">{ticket.createdBy}</p>

              {/* Department */}

              <p className="text-[11px] text-slate-400 truncate">{ticket.dept}</p>

              {/* Unread/Reminder Badge */}

              {(ticket.unreadCount > 0 || ticket.reminder_flag === 1) && activeTab === "active" && (

                <div className="flex items-center gap-2 mt-2">

                  {ticket.reminder_flag === 1 && (

                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">

                      Reminder

                    </span>

                  )}

                  {ticket.unreadCount > 0 && (

                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">

                      {ticket.unreadCount}

                    </span>

                  )}

                </div>

              )}

            </div>

          ))

        )}

      </div>

    </div>

  );

}

