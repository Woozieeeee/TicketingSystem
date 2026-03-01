"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { API_URL } from "../../config/api";

import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Clock,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
} from "lucide-react";
import CreateTicketModal from "../../components/createTicketModal";
import EditTicketModal from "../../components/editTicketModal";

interface Ticket {
  globalId: string | number;
  id: number;
  title: string;
  description: string;
  category?: string;
  status: string;
  createdBy: string;
  dept: string;
  date: string;
  userMarkedDone?: boolean;
  headMarkedDone?: boolean;
  lastUpdated?: string;
  reminder_flag?: boolean;
  last_reminded_at?: string;
}

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", current, "...", total];
};

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams ? searchParams.get("highlight") : null;
  const filterParam = searchParams ? searchParams.get("filter") : null;

  const [user, setUser] = useState<any>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);

  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [sortConfig] = useState<{
    key: keyof Ticket;
    direction: "asc" | "desc";
  } | null>({ key: "id", direction: "asc" });

  useEffect(() => {
    if (filterParam) {
      const validTabs = [
        "All",
        "Reminders",
        "Pending",
        "In Progress",
        "Resolved",
        "Finished",
      ];
      if (validTabs.includes(filterParam)) {
        setActiveTab(filterParam);
      }
    }
  }, [filterParam]);

  const fetchTickets = useCallback(async (currentUser: any) => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.role) params.set("role", currentUser.role);
      if (currentUser?.dept) params.set("dept", currentUser.dept);
      if (currentUser?.username) params.set("username", currentUser.username);

      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`);

      if (res.ok) {
        const serverTickets = await res.json();
        const transformed = serverTickets.map((t: any, idx: number) => ({
          globalId: t.id,
          id: idx + 1,
          title: t.title,
          description: t.description,
          category: t.category || "General",
          status:
            t.status === "PENDING"
              ? "Pending"
              : t.status === "IN_PROGRESS"
                ? "In Progress"
                : t.status === "RESOLVED"
                  ? "Resolved"
                  : t.status === "FINISHED"
                    ? "Finished"
                    : t.status,
          createdBy: t.createdBy || "Unknown",
          dept: t.dept,
          date: t.createdAt || new Date().toISOString(),
          userMarkedDone: Boolean(t.userMarkedDone),
          headMarkedDone: Boolean(t.headMarkedDone),
          lastUpdated: t.updatedAt,
          reminder_flag: Boolean(t.reminder_flag),
          last_reminded_at: t.last_reminded_at,
        }));

        setTickets(transformed);
        localStorage.setItem("myTickets", JSON.stringify(transformed));
      }
    } catch (error: any) {
      console.error("Connection Failed", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTickets(user);
    const intervalId = setInterval(() => {
      fetchTickets(user);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user, fetchTickets]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets(user);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSendReminder = async (globalId: string | number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.globalId === globalId ? { ...t, reminder_flag: true } : t,
      ),
    );
    try {
      const res = await fetch(`${API_URL}/api/tickets/${globalId}/remind`, {
        method: "PUT",
      });
      if (res.ok) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Reminder Sent!",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("Failed to send reminder");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, categoryFilter, ticketsPerPage]);

  const filteredByRole = tickets.filter((ticket) => {
    if (!user) return false;
    if (user.role === "Head") return ticket.dept === user.dept;
    return ticket.createdBy === user.username;
  });

  const filteredTickets = filteredByRole.filter((ticket) => {
    let tabMatch = false;
    const minutesSinceCreated =
      (new Date().getTime() - new Date(ticket.date).getTime()) / 60000;

    if (activeTab === "Reminders") {
      tabMatch = Boolean(
        ticket.status === "Pending" &&
        (ticket.reminder_flag || minutesSinceCreated >= 5),
      );
    } else if (activeTab === "In Progress") {
      tabMatch =
        ticket.status === "In Progress" || ticket.status === "Resolved";
    } else if (activeTab === "Resolved") {
      tabMatch = ticket.status === "Resolved";
    } else if (activeTab === "All") {
      tabMatch = ticket.status !== "Finished";
    } else {
      tabMatch = ticket.status === activeTab;
    }
    const categoryMatch =
      categoryFilter === "All" || ticket.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const searchMatch =
      !q ||
      ticket.title.toLowerCase().includes(q) ||
      ticket.createdBy.toLowerCase().includes(q) ||
      ticket.category?.toLowerCase().includes(q) ||
      String(ticket.id).includes(q) ||
      String(ticket.globalId).includes(q);

    return tabMatch && categoryMatch && searchMatch;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.reminder_flag && !b.reminder_flag) return -1;
    if (!a.reminder_flag && b.reminder_flag) return 1;
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key as keyof Ticket] ?? "";
    const valB = b[key as keyof Ticket] ?? "";
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = sortedTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket,
  );
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

  const handleCloseModal = () => {
    setSelectedTicket(null);
    window.history.replaceState(null, "", "/tickets");
  };

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const localData = localStorage.getItem("myTickets");
      if (localData) {
        setTickets(JSON.parse(localData));
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (selectedTicket) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [selectedTicket]);

  useEffect(() => {
    if (highlightParam && tickets.length > 0) {
      setHighlightId(highlightParam);
      setTimeout(() => {
        const element = document.getElementById(`ticket-${highlightParam}`);
        if (element)
          element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      const autoOpenTimer = setTimeout(() => {
        const target = tickets.find(
          (t) => String(t.globalId) === highlightParam,
        );
        if (target && !selectedTicket) setSelectedTicket(target);
      }, 1000);

      const resetTimer = setTimeout(() => {
        setHighlightId(null);
        window.history.replaceState(null, "", "/tickets");
      }, 3500);

      return () => {
        clearTimeout(autoOpenTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [highlightParam, tickets.length]);

  const handleTicketAction = async (
    globalId: string | number,
    payload: any,
  ) => {
    let finalStatusToDB = payload.status;
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.globalId === globalId) {
        const t = {
          ...ticket,
          ...payload,
          lastUpdated: new Date().toISOString(),
        };
        if (payload.status === "Pending") {
          t.userMarkedDone = false;
          t.headMarkedDone = false;
        }
        if (t.userMarkedDone && t.headMarkedDone && t.status !== "Finished") {
          t.status = "Finished";
          finalStatusToDB = "FINISHED";
        } else if (
          (t.userMarkedDone || t.headMarkedDone) &&
          !(t.userMarkedDone && t.headMarkedDone) &&
          t.status !== "Resolved" &&
          t.status !== "Pending"
        ) {
          t.status = "Resolved";
          finalStatusToDB = "RESOLVED";
        }
        return t;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem("myTickets", JSON.stringify(updatedTickets));

    const dbPayload = { ...payload };
    if (finalStatusToDB) {
      if (finalStatusToDB === "In Progress") dbPayload.status = "IN_PROGRESS";
      else if (finalStatusToDB === "Pending") dbPayload.status = "PENDING";
      else dbPayload.status = finalStatusToDB;
    }

    try {
      await fetch(`${API_URL}/api/tickets/${globalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
      handleCloseModal();
      let toastTitle = "Ticket Updated";
      let toastIcon: "success" | "info" | "warning" = "success";
      if (payload.status === "In Progress") toastTitle = "Ticket Accepted";
      if (payload.userMarkedDone || payload.headMarkedDone)
        toastTitle = "Resolution Confirmed";
      if (payload.status === "Pending") {
        toastTitle = "Ticket Re-opened";
        toastIcon = "warning";
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: toastIcon,
        title: toastTitle,
        showConfirmButton: false,
        timer: 2000,
      });

      fetchTickets(user);
    } catch (error) {
      console.error("Error updating ticket on server:", error);
    }
  };

  const getStatusData = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-600",
          dot: "#f59e0b",
        };
      case "In Progress":
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-600",
          dot: "#6366f1",
        };
      case "Resolved":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-600",
          dot: "#10b981",
        };
      case "Finished":
        return {
          bg: "bg-cyan-50",
          border: "border-cyan-200",
          text: "text-cyan-600",
          dot: "#06b6d4",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-600",
          dot: "#9ca3af",
        };
    }
  };

  const deptAccent =
    user?.dept === "Nursing"
      ? { color: "#e11d48", bgTw: "bg-rose-50", colorTw: "text-rose-500" }
      : { color: "#16a34a", bgTw: "bg-green-50", colorTw: "text-green-500" };

  if (!mounted || isLoading || !user)
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-slate-100">
        <div
          className="w-10 h-10 border-4 border-slate-200 rounded-full mx-auto animate-spin"
          style={{ borderTopColor: deptAccent.color }}
        />
      </div>
    );

  const availableTabs =
    user.role === "Head"
      ? ["All", "Reminders", "Pending", "In Progress", "Resolved", "Finished"]
      : ["All", "Pending", "In Progress", "Resolved", "Finished"];

  return (
    <div className="min-h-[100dvh] bg-slate-50 w-full overflow-x-hidden">
      <main className="responsive-main transition-all duration-300 ease-in-out bg-slate-50 p-2 sm:p-5 lg:p-8 min-h-[100dvh] font-sans box-border pb-24 sm:pb-8">
        {/* ── 🟢 FIXED HEADER: Unclumped & Fully Visible Title ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6 mb-4 lg:mb-7 animate-fadeIn w-full">
          {/* Top Row (Mobile): Title & Back button */}
          <div className="flex items-center gap-1.5 lg:gap-3 w-full md:w-auto">
            {/* 🟢 FIXED: Shrunk back button slightly */}
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1 sm:p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-100 text-slate-500 transition-all active:scale-95 shadow-sm flex-shrink-0"
              title="Go back"
            >
              <ArrowLeft size={14} className="sm:w-5 sm:h-5" />
            </button>
            {/* 🟢 FIXED: Removed truncation, reduced text size to fit one line cleanly */}
            <h1
              className="text-[15px] sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Tickets
            </h1>
          </div>

          {/* Bottom Row (Mobile): Search & Actions */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2 w-full md:w-auto mt-1 md:mt-0">
            <div className="relative flex-1 min-w-[120px] sm:min-w-[200px] lg:min-w-[320px]">
              <Search
                className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 sm:pl-8 sm:pr-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition-all font-semibold text-[11px] sm:text-sm shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleRefresh}
                className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center h-[30px] w-[30px] sm:w-auto sm:h-auto"
                title="Refresh"
              >
                <RotateCcw
                  size={14}
                  className={`text-slate-600 sm:w-[16px] sm:h-[16px] ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              {user.role !== "Head" && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-0 sm:px-4 py-0 sm:py-2 rounded-lg text-white font-bold transition-all shadow-sm active:scale-95 h-[30px] w-[30px] sm:w-auto sm:h-auto"
                  style={{ backgroundColor: deptAccent.color }}
                  title="Create New Ticket"
                >
                  <Plus
                    size={16}
                    className="sm:w-[16px] sm:h-[16px]"
                    strokeWidth={3}
                  />
                  {/* Text is hidden on mobile, leaving just the Plus icon */}
                  <span className="hidden sm:inline text-sm ml-1.5">
                    New Ticket
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full max-w-full">
          {/* ── TABS ── */}
          <div className="px-2 sm:px-6 pt-2 sm:pt-5 border-b border-slate-200 w-full overflow-hidden">
            <div
              className="flex gap-3 sm:gap-6 overflow-x-auto pb-0 smooth-scroll w-full"
              role="tablist"
            >
              {availableTabs.map((tab) => {
                let count = 0;
                if (tab === "All")
                  count = filteredByRole.filter(
                    (t) => t.status !== "Finished",
                  ).length;
                else if (tab === "Reminders")
                  count = filteredByRole.filter(
                    (t) =>
                      t.status === "Pending" &&
                      (t.reminder_flag ||
                        (new Date().getTime() - new Date(t.date).getTime()) /
                          60000 >=
                          5),
                  ).length;
                else if (tab === "In Progress")
                  count = filteredByRole.filter(
                    (t) =>
                      t.status === "In Progress" || t.status === "Resolved",
                  ).length;
                else
                  count = filteredByRole.filter((t) => t.status === tab).length;

                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 sm:pb-3 flex items-center gap-1 sm:gap-2 border-b-2 sm:border-b-4 transition-all whitespace-nowrap ${isActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    <span className="font-black text-[9px] sm:text-xs uppercase tracking-widest">
                      {tab}
                    </span>
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black ${isActive ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 🟢 FIXED TABLE CONTAINER: Removed Forced Minimum Height ── */}
          {/* By removing min-h classes, the table container will perfectly wrap your rows without extra blank space below. */}
          <div className="overflow-x-auto w-full smooth-scroll">
            <table className="w-full text-left whitespace-nowrap min-w-full sm:min-w-[550px]">
              <thead>
                <tr className="text-[7.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  {user.role === "Head" && (
                    <th className="px-2 sm:px-6 py-2.5 font-black">Sender</th>
                  )}
                  <th className="px-2 sm:px-6 py-2.5 font-black">Cat.</th>
                  <th className="px-2 sm:px-6 py-2.5 font-black">Subject</th>
                  <th className="px-2 sm:px-6 py-2.5 font-black">Status</th>
                  <th className="px-2 sm:px-6 py-2.5 font-black">Date</th>
                  <th className="px-2 sm:px-6 py-2.5 font-black text-right">
                    Opt.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTickets.map((ticket) => {
                  const statusData = getStatusData(ticket.status);
                  const isHighlighted = highlightId === String(ticket.globalId);
                  const hasIConfirmed =
                    (user.role === "User" && ticket.userMarkedDone) ||
                    (user.role === "Head" && ticket.headMarkedDone);
                  const isReminded =
                    ticket.status === "Pending" && ticket.reminder_flag;

                  return (
                    <tr
                      key={ticket.globalId}
                      id={`ticket-${ticket.globalId}`}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`group transition-all duration-300 cursor-pointer border-l-[3px] hover:bg-slate-50 ${isHighlighted ? "bg-slate-100 border-l-slate-300" : isReminded ? "border-l-rose-500" : "border-l-transparent"} ${hasIConfirmed && ticket.status === "Resolved" ? "opacity-60 bg-slate-50/50" : ""}`}
                    >
                      {user.role === "Head" && (
                        <td className="px-2 sm:px-6 py-2.5 sm:py-3">
                          <div className="flex flex-col">
                            <span className="text-[8.5px] sm:text-sm font-black text-slate-800">
                              {ticket.createdBy}
                            </span>
                            <span className="text-[7.5px] sm:text-[10px] font-bold text-slate-400">
                              #{ticket.id}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-slate-100 text-slate-500 text-[7px] sm:text-[10px] font-black uppercase tracking-widest">
                          {ticket.category?.slice(0, 8)}
                          {ticket.category && ticket.category.length > 8
                            ? "..."
                            : ""}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
                        <div className="flex flex-col max-w-[85px] sm:max-w-[200px]">
                          <span className="text-[9px] sm:text-sm font-black text-slate-800 truncate">
                            {ticket.title}
                          </span>
                          {user.role !== "Head" && (
                            <span className="text-[7.5px] sm:text-[10px] font-bold text-slate-400 mt-0.5">
                              #{ticket.id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2.5 sm:py-3">
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border text-[7px] sm:text-[9px] font-black uppercase tracking-widest ${statusData.bg} ${statusData.border} ${statusData.text}`}
                          >
                            <span
                              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0"
                              style={{ background: statusData.dot }}
                            />
                            <span className="truncate max-w-[45px] sm:max-w-none">
                              {ticket.status}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2.5 sm:py-3 text-[8px] sm:text-xs font-bold text-slate-500">
                        {new Date(ticket.date).toLocaleDateString()}
                      </td>
                      <td
                        className="px-2 sm:px-6 py-2.5 sm:py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionButtons
                          ticket={ticket}
                          user={user}
                          onAction={handleTicketAction}
                          onEdit={setTicketToEdit}
                          onRemind={handleSendReminder}
                          deptAccent={deptAccent}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 🟢 FIXED: ULTRA COMPACT 1-LINE PAGINATION (Shows Only Current Page Number) ── */}
          {sortedTickets.length > 0 && (
            <div className="px-3 py-2 sm:px-6 sm:py-4 border-t border-slate-200 flex flex-row items-center justify-between gap-1 bg-slate-50/50 w-full box-border rounded-b-xl overflow-hidden">
              {/* Range text */}
              <div className="text-[9px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap flex-shrink-0">
                {indexOfFirstTicket + 1}-
                {Math.min(indexOfLastTicket, sortedTickets.length)}{" "}
                <span className="hidden sm:inline">
                  of {sortedTickets.length}
                </span>
              </div>

              {/* Controls - Shows ONLY Current Page Number (< 1 >) */}
              <div className="flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full p-0.5 sm:p-1 flex-shrink-0 mx-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="p-1 sm:px-2 text-teal-600 hover:text-teal-700 disabled:opacity-40"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>

              {/* Dropdown - compact */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[9px] sm:text-xs font-bold text-slate-500 hidden sm:inline">
                  Rows:
                </span>
                <select
                  value={ticketsPerPage}
                  onChange={(e) => setTicketsPerPage(Number(e.target.value))}
                  className="p-0.5 sm:p-1 border border-slate-200 rounded bg-white text-[9px] sm:text-xs font-bold text-slate-600 outline-none cursor-pointer shadow-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchTickets(user)}
        />
        <EditTicketModal
          isOpen={!!ticketToEdit}
          ticket={ticketToEdit}
          onClose={() => setTicketToEdit(null)}
          onSuccess={() => {
            fetchTickets(user);
            setTicketToEdit(null);
          }}
        />
      </main>

      {/* ── DETAILS MODAL ── */}
      {mounted &&
        selectedTicket &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 animate-fadeIn"
            onClick={handleCloseModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-2xl lg:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
            >
              <div
                className="px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between w-full"
                style={{ backgroundColor: "#15803d" }}
              >
                <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-xl font-extrabold text-white flex items-center gap-2 truncate">
                    <span className="truncate">Ticket Details</span>
                    <span
                      className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold border border-white/40 flex-shrink-0 ${selectedTicket.status === "Finished" ? "bg-cyan-500" : selectedTicket.status === "Resolved" ? "bg-emerald-500" : "bg-white/20"}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-green-100 uppercase tracking-widest truncate">
                    ID: {selectedTicket.globalId} • {selectedTicket.createdBy}
                  </span>
                </div>
                <button
                  className="p-1.5 sm:p-2 hover:bg-black/10 rounded-full text-white transition-colors flex-shrink-0"
                  onClick={handleCloseModal}
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 smooth-scroll">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Request Details:
                  </label>
                  <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words min-h-[150px] shadow-sm">
                    {selectedTicket.description || "No description."}
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-slate-200 bg-white p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                  <ModalActionButtons
                    ticket={selectedTicket}
                    user={user}
                    onAction={handleTicketAction}
                    deptAccent={deptAccent}
                  />
                </div>
                <button
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-200 active:scale-95 transition-all"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 🟢 CUSTOM CSS WITH STRICT BOUNDARY RULES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        body { font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Syne', sans-serif; }
        
        .smooth-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .smooth-scroll::-webkit-scrollbar { display: none; }
        
        /* 🟢 STRICT WIDTH RULES: 100% blocks right-side bleeding/shifting */
        .responsive-main { margin-left: 0px; width: 100%; max-width: 100%; box-sizing: border-box; }
        @media (min-width: 1024px) { 
          .responsive-main { margin-left: var(--sidebar-width, 256px); width: calc(100% - var(--sidebar-width, 256px)); } 
        }

        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Helpers for responsive hiding */
        .hide-on-mobile { display: inline; }

        /* 📱 Extremely Small Phones (e.g. 360px wide) */
        @media (max-width: 450px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── ACTION COMPONENTS ──

function ActionButtons({
  ticket,
  user,
  onAction,
  onEdit,
  onRemind,
  deptAccent,
}: any) {
  const minutesPast =
    (new Date().getTime() - new Date(ticket.date).getTime()) / 60000;
  const isOngoing =
    ticket.status === "In Progress" || ticket.status === "Resolved";

  return (
    <div className="flex gap-1 sm:gap-2 items-center justify-end">
      {user?.role === "User" &&
        String(ticket.createdBy) === String(user?.username) && (
          <>
            {ticket.status === "Pending" && (
              <>
                <button
                  className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ticket);
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    className="sm:w-3 sm:h-3"
                  >
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
                    <Bell size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
                    <span className="hidden sm:inline">Nudge</span>
                  </button>
                ) : null}
              </>
            )}

            {isOngoing && !ticket.userMarkedDone && (
              <button
                className="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 border border-emerald-300 text-emerald-600 rounded font-black text-[7px] sm:text-[9px] uppercase tracking-widest"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(ticket.globalId, { userMarkedDone: true });
                }}
              >
                <CheckCircle size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
                <span>Confirm</span>
              </button>
            )}
          </>
        )}

      {user?.role === "Head" && ticket.status === "Pending" && (
        <button
          className="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-white font-black text-[7px] sm:text-[9px] uppercase tracking-widest"
          style={{ backgroundColor: deptAccent.color }}
          onClick={(e) => {
            e.stopPropagation();
            onAction(ticket.globalId, { status: "In Progress" });
          }}
        >
          <PlayCircle size={8} className="sm:w-2.5 sm:h-2.5" />{" "}
          <span>Accept</span>
        </button>
      )}
    </div>
  );
}

function ModalActionButtons({ ticket, user, onAction, deptAccent }: any) {
  const isOngoing =
    ticket.status === "In Progress" || ticket.status === "Resolved";

  if (user?.role === "Head") {
    if (ticket.status === "Pending")
      return (
        <button
          onClick={() => onAction(ticket.globalId, { status: "In Progress" })}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl font-bold text-xs sm:text-sm"
          style={{ backgroundColor: deptAccent.color }}
        >
          <PlayCircle size={16} /> Start Work
        </button>
      );
    if (isOngoing && !ticket.headMarkedDone)
      return (
        <button
          onClick={() => onAction(ticket.globalId, { headMarkedDone: true })}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-50"
        >
          <CheckCircle size={16} /> Mark Resolved
        </button>
      );
  }

  if (
    user?.role === "User" &&
    isOngoing &&
    String(ticket.createdBy) === String(user?.username) &&
    !ticket.userMarkedDone
  ) {
    return (
      <button
        onClick={() => onAction(ticket.globalId, { userMarkedDone: true })}
        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-50"
      >
        <CheckCircle size={16} /> Confirm Fixed
      </button>
    );
  }
  return null;
}
