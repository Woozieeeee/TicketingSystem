"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";
import type { Ticket, SortConfig, User } from "../types/tickets";

export function useTickets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams ? searchParams.get("highlight") : null;
  const filterParam = searchParams ? searchParams.get("filter") : null;
  const glowParam = searchParams ? searchParams.get("glow") : null;

  const [user, setUser] = useState<User | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isGroupGlowing, setIsGroupGlowing] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [sortConfig] = useState<SortConfig | null>({ key: "id", direction: "asc" });

  // Initialize filter from URL params
  useEffect(() => {
    if (filterParam) {
      const validTabs = ["All", "Reminders", "Pending", "In Progress", "Resolved", "Finished"];
      if (validTabs.includes(filterParam)) {
        setActiveTab(filterParam);
      }
    }
  }, [filterParam]);

  // Handle glow effect from URL
  useEffect(() => {
    if (glowParam === "true") {
      setIsGroupGlowing(true);
      const timer = setTimeout(() => setIsGroupGlowing(false), 2500);
      const newUrl = filterParam ? `/tickets?filter=${filterParam}` : "/tickets";
      window.history.replaceState(null, "", newUrl);
      return () => clearTimeout(timer);
    }
  }, [glowParam, filterParam]);

  // Fetch tickets from API
  const fetchTickets = useCallback(async (currentUser: User | null) => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.role) params.set("role", currentUser.role);
      if (currentUser?.dept) params.set("dept", currentUser.dept);
      if (currentUser?.username) params.set("username", currentUser.username);

      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const serverTickets = await res.json();
        const transformed: Ticket[] = serverTickets.map((t: any, idx: number) => ({
          globalId: t.id,
          id: idx + 1,
          title: t.title,
          description: t.description,
          category: t.category || "General",
          status: t.status === "PENDING" ? "Pending" :
                  t.status === "IN_PROGRESS" ? "In Progress" :
                  t.status === "RESOLVED" ? "Resolved" :
                  t.status === "FINISHED" ? "Finished" : t.status,
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

  // Auto-fetch tickets when user changes
  useEffect(() => {
    if (!user) return;
    fetchTickets(user);
    const intervalId = setInterval(() => fetchTickets(user), 5000);
    return () => clearInterval(intervalId);
  }, [user, fetchTickets]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, categoryFilter, ticketsPerPage]);

  // Initialize user on mount - always fetch fresh data from API
  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoading(true);
    } else {
      router.push("/login");
    }
  }, [router]);

  // Handle body scroll lock when modal open
  useEffect(() => {
    if (selectedTicket) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [selectedTicket]);

  // Handle highlight param from URL
  useEffect(() => {
    if (highlightParam && tickets.length > 0) {
      setHighlightId(highlightParam);
      setTimeout(() => {
        const element = document.getElementById(`ticket-${highlightParam}`);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      const autoOpenTimer = setTimeout(() => {
        const target = tickets.find((t) => String(t.globalId) === highlightParam);
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
  }, [highlightParam, tickets.length, selectedTicket]);

  // Handler functions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets(user);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSendReminder = async (globalId: string | number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.globalId === globalId ? { ...t, reminder_flag: true } : t
      )
    );
    try {
      const res = await fetch(`${API_URL}/api/tickets/${globalId}/remind`, {
        method: "PUT",
      });
      if (res.ok) {
        const Swal = (await import("sweetalert2")).default;
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

  const handleCloseModal = () => {
    setSelectedTicket(null);
    window.history.replaceState(null, "", "/tickets");
  };

  const handleTicketAction = async (globalId: string | number, payload: any) => {
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
      fetchTickets(user);
    } catch (error) {
      console.error("Error updating ticket on server:", error);
    }
  };

  // Filtering logic
  const filteredByRole = tickets.filter((ticket) => {
    if (!user) return false;
    if (user.role === "Head") return ticket.dept === user.dept;
    return ticket.createdBy === user.username;
  });

  const filteredTickets = filteredByRole.filter((ticket) => {
    let tabMatch = false;

    if (activeTab === "Reminders") {
      tabMatch = Boolean(ticket.status === "Pending" && ticket.reminder_flag);
    } else if (activeTab === "Pending") {
      tabMatch = Boolean(ticket.status === "Pending" && !ticket.reminder_flag);
    } else if (activeTab === "In Progress") {
      tabMatch = ticket.status === "In Progress" || ticket.status === "Resolved";
    } else if (activeTab === "Resolved") {
      tabMatch = ticket.status === "Resolved";
    } else if (activeTab === "All") {
      tabMatch = ticket.status !== "Finished";
    } else {
      tabMatch = ticket.status === activeTab;
    }

    const categoryMatch = categoryFilter === "All" || ticket.category === categoryFilter;
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

  // Sorting logic
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

  // Pagination logic
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

  // Department accent colors
  const deptAccent =
    user?.dept === "Nursing"
      ? { color: "#e11d48", bgTw: "bg-rose-50", colorTw: "text-rose-500" }
      : { color: "#16a34a", bgTw: "bg-green-50", colorTw: "text-green-500" };

  // Available tabs based on role
  const availableTabs =
    user?.role === "Head"
      ? ["All", "Reminders", "Pending", "In Progress", "Resolved", "Finished"]
      : ["All", "Pending", "In Progress", "Resolved", "Finished"];

  return {
    // State
    user,
    tickets,
    selectedTicket,
    ticketToEdit,
    highlightId,
    isGroupGlowing,
    activeTab,
    mounted,
    isLoading,
    searchQuery,
    isRefreshing,
    currentPage,
    ticketsPerPage,
    isCreateModalOpen,
    filteredByRole,
    sortedTickets,
    currentTickets,
    totalPages,
    indexOfFirstTicket,
    indexOfLastTicket,
    deptAccent,
    availableTabs,
    // Setters
    setSelectedTicket,
    setTicketToEdit,
    setActiveTab,
    setSearchQuery,
    setTicketsPerPage,
    setCurrentPage,
    setIsCreateModalOpen,
    // Handlers
    handleRefresh,
    handleSendReminder,
    handleCloseModal,
    handleTicketAction,
    fetchTickets,
    router,
  };
}
