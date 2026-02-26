"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Ticket as TicketIcon,
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

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams ? searchParams.get("highlight") : null;

  const [user, setUser] = useState<any>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ticket;
    direction: "asc" | "desc";
  } | null>({ key: "id", direction: "asc" });

  const fetchTickets = async (currentUser: any) => {
    const localData = localStorage.getItem("myTickets");
    if (localData) {
      setTickets(JSON.parse(localData));
      setIsLoading(false);
    } else setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const params = new URLSearchParams();
      if (currentUser?.role) params.set("role", currentUser.role);
      if (currentUser?.dept) params.set("dept", currentUser.dept);
      if (currentUser?.username) params.set("username", currentUser.username);

      const res = await fetch(
        `http://localhost:3001/api/tickets?${params.toString()}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      if (error.name === "AbortError")
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Connection Failed",
          showConfirmButton: false,
          timer: 4000,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (globalId: string | number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.globalId === globalId ? { ...t, reminder_flag: true } : t,
      ),
    );
    try {
      const res = await fetch(
        `http://localhost:3001/api/tickets/${globalId}/remind`,
        { method: "PUT" },
      );
      if (res.ok)
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Head Notified!",
          showConfirmButton: false,
          timer: 2000,
        });
    } catch (error) {
      console.error("Failed to send reminder");
    }
  };

  const filteredByRole = tickets.filter((ticket) => {
    if (!user) return false;
    if (user.role === "Head") return ticket.dept === user.dept;
    return ticket.createdBy === user.username;
  });

  const filteredTickets = filteredByRole.filter((ticket) => {
    if (activeTab === "Reminders") {
      const hoursSinceCreated =
        (new Date().getTime() - new Date(ticket.date).getTime()) /
        (1000 * 60 * 60);
      return (
        ticket.reminder_flag ||
        (ticket.status === "Pending" && hoursSinceCreated >= 24)
      );
    }
    const statusMatch = activeTab === "All" || ticket.status === activeTab;
    const categoryMatch =
      categoryFilter === "All" || ticket.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key as keyof Ticket] ?? "";
    const valB = b[key as keyof Ticket] ?? "";
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

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
      fetchTickets(parsedUser);
    } else router.push("/login");
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
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.globalId === globalId) {
        const t = {
          ...ticket,
          ...payload,
          lastUpdated: new Date().toISOString(),
        };
        if (t.userMarkedDone && t.headMarkedDone && t.status !== "Finished") {
          t.status = "Finished";
        }
        if (payload.status === "Pending") {
          t.userMarkedDone = false;
          t.headMarkedDone = false;
        }
        return t;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem("myTickets", JSON.stringify(updatedTickets));

    const dbPayload = { ...payload };
    if (dbPayload.status) {
      if (dbPayload.status === "In Progress") dbPayload.status = "IN_PROGRESS";
      else if (dbPayload.status === "Pending") dbPayload.status = "PENDING";
    }

    try {
      await fetch(`http://localhost:3001/api/tickets/${globalId}`, {
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
    } catch (error) {
      console.error("Error updating ticket on server:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-900",
          dot: "#f59e0b",
        };
      case "In Progress":
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-900",
          dot: "#6366f1",
        };
      case "Resolved":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-900",
          dot: "#10b981",
        };
      case "Finished":
        return {
          bg: "bg-cyan-50",
          border: "border-cyan-200",
          text: "text-cyan-900",
          dot: "#06b6d4",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
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
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div
          className="w-12 h-12 border-4 border-slate-200 rounded-full mx-auto animate-spin"
          style={{ borderTopColor: deptAccent.color }}
        />
      </div>
    );

  const availableTabs =
    user.role === "Head"
      ? ["All", "Reminders", "Pending", "In Progress", "Finished"]
      : ["All", "Pending", "In Progress", "Finished"];

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* 🟢 CSS DRIVEN RESPONSIVE MARGIN */}
      <main className="responsive-main transition-all duration-300 ease-in-out bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen font-sans">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 animate-fadeIn">
          <h1 className="text-2xl font-bold text-slate-900">
            Ticket Management
          </h1>
          {user.role !== "Head" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center cursor-pointer gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
              style={{ backgroundColor: deptAccent.color }}
            >
              Create New Ticket
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* TABS */}
          <div className="px-4 sm:px-6 pt-4 border-b border-slate-200">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-0 smooth-scroll">
              {availableTabs.map((tab) => {
                let count = 0;
                if (tab === "All") count = filteredByRole.length;
                else if (tab === "Reminders")
                  count = filteredByRole.filter(
                    (t) =>
                      t.reminder_flag ||
                      (t.status === "Pending" &&
                        (new Date().getTime() - new Date(t.date).getTime()) /
                          3600000 >=
                          24),
                  ).length;
                else
                  count = filteredByRole.filter((t) => t.status === tab).length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors relative flex items-center gap-1.5 ${activeTab === tab ? (tab === "Reminders" ? "text-rose-600" : "text-blue-600") : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {tab}
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded text-[10px] font-bold ${activeTab === tab ? (tab === "Reminders" ? "bg-rose-600 text-white" : "bg-blue-600 text-white") : tab === "Reminders" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-900"}`}
                    >
                      {count}
                    </span>
                    {activeTab === tab && (
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${tab === "Reminders" ? "bg-rose-600" : "bg-blue-600"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🟢 UNIFIED SMOOTH SCROLLING TABLE (Works on Mobile & Desktop) */}
          <div className="overflow-x-auto smooth-scroll w-full">
            <table className="w-full border-collapse min-w-[800px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {user.role === "Head" && (
                    <>
                      <th className="px-6 py-4 text-left">Sender</th>
                      <th className="px-6 py-4 text-left">ID</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Title</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.status);
                  const isHighlighted = highlightId === String(ticket.globalId);
                  const hoursPast =
                    (new Date().getTime() - new Date(ticket.date).getTime()) /
                    3600000;
                  const isUrgent =
                    ticket.status === "Pending" &&
                    (ticket.reminder_flag || hoursPast >= 24);

                  return (
                    <tr
                      key={ticket.globalId}
                      id={`ticket-${ticket.globalId}`}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`border-b border-slate-100 transition-colors duration-500 cursor-pointer border-l-4 ${isHighlighted ? "bg-slate-100 border-l-slate-300" : isUrgent ? "bg-rose-50/50 hover:bg-rose-50 border-l-rose-500" : "bg-white hover:bg-slate-50 border-l-transparent"}`}
                    >
                      {user.role === "Head" && (
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${deptAccent.bgTw} ${deptAccent.colorTw}`}
                            >
                              {String(ticket.createdBy).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700">
                              {ticket.createdBy}
                            </span>
                          </div>
                        </td>
                      )}
                      {user.role === "Head" && (
                        <td className="px-6 py-4 text-sm text-slate-500">
                          #{ticket.id}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {ticket.title}
                        {ticket.reminder_flag &&
                          ticket.status === "Pending" && (
                            <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 uppercase tracking-wider">
                              Nudged
                            </span>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: statusColor.dot }}
                          />
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(ticket.date).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4"
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

            {/* Empty State */}
            {sortedTickets.length === 0 && (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center w-full min-w-[800px]">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                  <TicketIcon size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium">No tickets found.</p>
              </div>
            )}
          </div>
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

      {/* ── RESPONSIVE DETAILS MODAL ── */}
      {mounted &&
        selectedTicket &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
            onClick={handleCloseModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-3xl lg:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp"
            >
              <div
                className="px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between w-full"
                style={{ backgroundColor: "#15803d" }}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2 truncate">
                    <span className="truncate">Ticket Details</span>
                    <span
                      className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-white/40 flex-shrink-0 ${selectedTicket.status === "Finished" ? "bg-cyan-500" : "bg-white/20"}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </h3>
                  <span className="text-[10px] sm:text-xs font-semibold text-green-100 uppercase tracking-widest">
                    ID: {selectedTicket.globalId} • Sender:{" "}
                    {selectedTicket.createdBy}
                  </span>
                </div>
                <button
                  className="p-2 hover:bg-black/10 rounded-full text-white transition-colors flex-shrink-0"
                  onClick={handleCloseModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50/50 smooth-scroll">
                <div className="flex flex-col gap-4">
                  <label className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">
                    Full Request Details
                  </label>
                  <div className="p-5 sm:p-8 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-base sm:text-lg text-slate-800 leading-relaxed whitespace-pre-wrap break-words min-h-[250px] sm:min-h-[300px] shadow-sm">
                    {selectedTicket.description ||
                      "No additional details provided."}
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-slate-200 bg-white px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                  <ModalActionButtons
                    ticket={selectedTicket}
                    user={user}
                    onAction={handleTicketAction}
                    deptAccent={deptAccent}
                  />
                </div>
                <button
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all"
                  onClick={handleCloseModal}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 🟢 CSS DRIVEN RESPONSIVENESS & SMOOTH SCROLLING */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3 { font-family: 'Syne', sans-serif; }
        
        /* Smooth Scrollbar for Table and Tabs */
        .smooth-scroll {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .smooth-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .smooth-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .smooth-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        /* Dynamic Sidebar Margin */
        .responsive-main {
          margin-left: 0px;
        }
        
        @media (min-width: 1024px) {
          .responsive-main {
            margin-left: var(--sidebar-width, 256px);
          }
        }

        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.4s ease both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── REUSABLE ACTION COMPONENTS ──

function ActionButtons({
  ticket,
  user,
  onAction,
  onEdit,
  onRemind,
  deptAccent,
}: any) {
  const hoursPast =
    (new Date().getTime() - new Date(ticket.date).getTime()) / 3600000;

  return (
    <div className="flex gap-2 items-center">
      {user?.role === "User" &&
        String(ticket.createdBy) === String(user?.username) && (
          <>
            {ticket.status === "Pending" && (
              <>
                <button
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
                  onClick={() => onEdit(ticket)}
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                {ticket.reminder_flag ? (
                  <span className="text-[10px] text-rose-500 font-bold px-2 py-1 bg-rose-50 rounded-md border border-rose-200">
                    Notified
                  </span>
                ) : hoursPast >= 4 ? (
                  <button
                    onClick={() => onRemind(ticket.globalId)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200 active:scale-95 transition-all"
                  >
                    <Bell size={14} />
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium italic">
                    Nudge in {Math.ceil(4 - hoursPast)}h
                  </span>
                )}
              </>
            )}
            {ticket.status === "In Progress" && !ticket.userMarkedDone && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 border border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm active:scale-95 transition-all"
                onClick={() =>
                  onAction(ticket.globalId, { userMarkedDone: true })
                }
                title="Confirm Resolution"
              >
                <CheckCircle size={14} />{" "}
                <span className="text-xs font-bold">Resolve</span>
              </button>
            )}
            {ticket.status === "In Progress" &&
              !ticket.headMarkedDone &&
              ticket.userMarkedDone && (
                <span className="text-[10px] italic text-slate-400 font-medium border border-slate-200 bg-slate-50 px-2 py-1 rounded">
                  Awaiting Head
                </span>
              )}
          </>
        )}

      {user?.role === "Head" && (
        <>
          {ticket.status === "Pending" && (
            <button
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-white shadow-sm active:scale-95 transition-all"
              style={{ backgroundColor: deptAccent.color }}
              onClick={() =>
                onAction(ticket.globalId, { status: "In Progress" })
              }
            >
              <PlayCircle size={14} />{" "}
              <span className="text-xs font-bold ml-1.5">Accept</span>
            </button>
          )}
          {ticket.status === "In Progress" && !ticket.headMarkedDone && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 border border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm active:scale-95 transition-all"
              onClick={() =>
                onAction(ticket.globalId, { headMarkedDone: true })
              }
              title="Mark as Resolved"
            >
              <CheckCircle size={14} />{" "}
              <span className="text-xs font-bold">Resolve</span>
            </button>
          )}
          {ticket.status === "In Progress" &&
            !ticket.userMarkedDone &&
            ticket.headMarkedDone && (
              <span className="text-[10px] italic text-slate-400 font-medium border border-slate-200 bg-slate-50 px-2 py-1 rounded">
                Awaiting User
              </span>
            )}
        </>
      )}
    </div>
  );
}

function ModalActionButtons({ ticket, user, onAction, deptAccent }: any) {
  if (user?.role === "Head") {
    if (ticket.status === "Pending")
      return (
        <button
          onClick={() => onAction(ticket.globalId, { status: "In Progress" })}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm shadow-md active:scale-95"
          style={{ backgroundColor: deptAccent.color }}
        >
          <PlayCircle size={18} /> Accept & Start
        </button>
      );
    if (ticket.status === "In Progress" && !ticket.headMarkedDone)
      return (
        <>
          <button
            onClick={() => onAction(ticket.globalId, { headMarkedDone: true })}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95"
          >
            <CheckCircle size={18} /> Mark as Resolved
          </button>
          {ticket.userMarkedDone && (
            <button
              onClick={() => {
                Swal.fire({
                  title: "Reject Fix?",
                  text: "This will reopen the ticket.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Yes",
                }).then((r) => {
                  if (r.isConfirmed)
                    onAction(ticket.globalId, { status: "Pending" });
                });
              }}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm active:scale-95"
            >
              <AlertTriangle size={18} /> Reject User's Fix
            </button>
          )}
        </>
      );
    if (
      ticket.status === "In Progress" &&
      ticket.headMarkedDone &&
      !ticket.userMarkedDone
    )
      return (
        <span className="w-full sm:w-auto text-center inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold border border-slate-200">
          Awaiting User Confirmation
        </span>
      );
  }

  if (
    user?.role === "User" &&
    ticket.status === "In Progress" &&
    String(ticket.createdBy) === String(user?.username)
  ) {
    if (!ticket.userMarkedDone)
      return (
        <>
          <button
            onClick={() => onAction(ticket.globalId, { userMarkedDone: true })}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95"
          >
            <CheckCircle size={18} /> Confirm Resolution
          </button>
          {ticket.headMarkedDone && (
            <button
              onClick={() => {
                Swal.fire({
                  title: "Re-open Ticket?",
                  text: "Send back to queue?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Yes",
                }).then((r) => {
                  if (r.isConfirmed)
                    onAction(ticket.globalId, { status: "Pending" });
                });
              }}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm active:scale-95"
            >
              <AlertTriangle size={18} /> Disagree & Re-open
            </button>
          )}
        </>
      );
    if (ticket.userMarkedDone && !ticket.headMarkedDone)
      return (
        <span className="w-full sm:w-auto text-center inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold border border-slate-200">
          Awaiting Head Confirmation
        </span>
      );
  }
  return null;
}
