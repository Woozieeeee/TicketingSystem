"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { getRelativeTime } from "../../lib/utils";

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
}

export default function TicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ticket;
    direction: "asc" | "desc";
  } | null>({ key: "id", direction: "asc" });

  const fetchTickets = async (currentUser: any) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentUser?.role) params.set("role", currentUser.role);
      if (currentUser?.dept) params.set("dept", currentUser.dept);
      if (currentUser?.id) params.set("userId", currentUser.id);

      const res = await fetch(
        `http://localhost:3001/api/tickets?${params.toString()}`,
      );
      if (res.ok) {
        const serverTickets = await res.json();
        // Transform API response to match UI expectations
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
                  : t.status,
          createdBy: t.createdBy || "Unknown",
          dept: t.dept,
          date: t.createdAt || new Date().toISOString(),
          userMarkedDone: false,
          headMarkedDone: false,
          lastUpdated: t.updatedAt,
        }));

        const localData = localStorage.getItem("myTickets");
        if (localData) {
          const localTickets = JSON.parse(localData);
          const merged = transformed.map((sTicket: Ticket) => {
            const localMatch = localTickets.find(
              (l: Ticket) => l.globalId === sTicket.globalId,
            );
            return localMatch ? { ...sTicket, ...localMatch } : sTicket;
          });
          setTickets(merged);
        } else {
          setTickets(transformed);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredByRole = tickets.filter((ticket) => {
    if (!user) return false;
    if (user.role === "Head") return ticket.dept === user.dept;
    return ticket.createdBy === user.username;
  });

  const filteredTickets = filteredByRole.filter((ticket) => {
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
    router.push("/tickets", { scroll: false });
    setTimeout(() => {
      setSelectedTicket(null);
    }, 50);
  };

  useEffect(() => {
    if (!highlightId && selectedTicket) {
      setSelectedTicket(null);
    }
  }, [highlightId, selectedTicket]);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTickets(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (selectedTicket) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (highlightId && sortedTickets.length > 0) {
      const ticketToHighlight = sortedTickets.find(
        (t) => String(t.globalId) === String(highlightId),
      );

      if (ticketToHighlight) {
        setSelectedTicket(ticketToHighlight);
        const element = document.getElementById(`ticket-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [highlightId, sortedTickets]);

  const handleStatusChange = async (
    globalId: string | number,
    newStatus: string,
  ) => {
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.globalId === globalId) {
        const isHead = user?.role === "Head";
        const isUser = user?.role === "User";

        if (newStatus === "In Progress") {
          return {
            ...ticket,
            status: "In Progress",
            lastUpdated: new Date().toISOString(),
          };
        }

        const updatedTicket = {
          ...ticket,
          headMarkedDone: isHead ? true : ticket.headMarkedDone || false,
          userMarkedDone: isUser ? true : ticket.userMarkedDone || false,
          lastUpdated: new Date().toISOString(),
        };

        if (updatedTicket.headMarkedDone && updatedTicket.userMarkedDone) {
          updatedTicket.status = "Resolved";
        }
        return updatedTicket;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem("myTickets", JSON.stringify(updatedTickets));

    try {
      const dbStatus =
        newStatus === "In Progress"
          ? "IN_PROGRESS"
          : newStatus === "Resolved"
            ? "RESOLVED"
            : "PENDING";
      const res = await fetch(`http://localhost:3001/api/tickets/${globalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus }),
      });
      if (!res.ok) {
        console.error("Failed to update ticket on server");
      }
    } catch (error) {
      console.error("Error updating ticket on server:", error);
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Status Updated",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleSort = (key: keyof Ticket) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          bg: "rgba(245, 158, 11, 0.1)",
          border: "#fbbf24",
          text: "#92400e",
          dot: "#f59e0b",
        };
      case "In Progress":
        return {
          bg: "rgba(99, 102, 241, 0.1)",
          border: "#a5b4fc",
          text: "#3730a3",
          dot: "#6366f1",
        };
      case "Resolved":
        return {
          bg: "rgba(16, 185, 129, 0.1)",
          border: "#6ee7b7",
          text: "#065f46",
          dot: "#10b981",
        };
      default:
        return {
          bg: "#f3f4f6",
          border: "#e5e7eb",
          text: "#4b5563",
          dot: "#9ca3af",
        };
    }
  };

  const deptAccent =
    user?.dept === "Nursing"
      ? { color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" }
      : user?.dept === "IT"
        ? {
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#bfdbfe",
            text: "#1e40af",
          }
        : {
            color: "#059669",
            bg: "#ecfdf5",
            border: "#a7f3d0",
            text: "#065f46",
          };

  if (!mounted || isLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f0f4f8",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid #e2e8f0",
              borderTopColor: deptAccent.color,
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Loading tickets…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        * { box-sizing: border-box; }

        .ticket-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'DM Sans', sans-serif;
        }

        .ticket-table thead tr {
          background: #ffffff;
          border-bottom: 1px solid #e8eef5;
        }

        .ticket-table th {
          padding: 14px 18px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .ticket-table th:hover {
          color: #334155;
          background: #fafbfc;
        }

        .ticket-table tbody tr {
          border-bottom: 1px solid #f5f6f9;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ticket-table tbody tr:hover {
          background: #fafbfc;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03);
        }

        .ticket-table tbody tr.highlight {
          background: rgba(37, 99, 235, 0.04);
          border-left: 3px solid #2563eb;
        }

        .ticket-table td {
          padding: 14px 18px;
          font-size: 13px;
          color: #334155;
        }

        .tab-nav {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid #e8eef5;
          overflow-x: auto;
          padding-bottom: 0;
        }

        .tab-btn {
          padding: 12px 0;
          border: none;
          background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: #64748b;
        }

        .tab-btn.active {
          color: #2563eb;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #2563eb;
          border-radius: 1px;
        }

        .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          margin-left: 6px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 700;
          background: #e0e7ff;
          color: #3730a3;
        }

        .tab-btn.active .tab-badge {
          background: #2563eb;
          color: #ffffff;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid #e8eef5;
          background: #ffffff;
          border-radius: 7px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          border-color: #d8dfe8;
          background: #fafbfc;
          color: #334155;
        }

        .btn-icon svg {
          width: 14px;
          height: 14px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .user-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          margin-right: 6px;
          flex-shrink: 0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(0.5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          width: 480px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f5f6f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #cbd5e1;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #64748b;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .modal-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .modal-field {
          padding: 12px;
          background: #fafbfc;
          border: 1px solid #e8eef5;
          border-radius: 9px;
          font-size: 13px;
          color: #334155;
          font-family: 'DM Sans', sans-serif;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #f5f6f9;
          display: flex;
          gap: 12px;
        }

        .modal-footer button {
          flex: 1;
          padding: 11px 18px;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-footer .btn-close {
          background: #2563eb;
          color: #ffffff;
        }

        .modal-footer .btn-close:hover {
          background: #1d4ed8;
        }

        .fade-in {
          animation: fadeIn 0.4s ease both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <main
        style={{
          marginLeft: "260px",
          backgroundColor: "#fafbfc",
          padding: "32px 32px",
          minHeight: "100vh",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Ticket Management
          </h1>
          {user.role !== "Head" && (
            <button
              onClick={() => router.push("/tickets/create")}
              className="btn-primary"
              style={{ background: deptAccent.color, color: "#ffffff" }}
            >
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              Create New Ticket
            </button>
          )}
        </div>

        {/* Main Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e8eef5",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            overflow: "hidden",
          }}
        >
          {/* Tab Navigation */}
          <div
            style={{ padding: "16px 18px", borderBottom: "1px solid #f5f6f9" }}
          >
            <div className="tab-nav">
              {["All", "Pending", "In Progress", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                >
                  {tab}
                  <span className="tab-badge">
                    {tab === "All"
                      ? filteredByRole.length
                      : filteredByRole.filter((t) => t.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: "auto" }}>
            <table className="ticket-table">
              <thead>
                <tr>
                  {user.role === "Head" && (
                    <>
                      <th onClick={() => handleSort("createdBy")}>
                        Sender{" "}
                        {sortConfig?.key === "createdBy" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th onClick={() => handleSort("id")}>
                        ID{" "}
                        {sortConfig?.key === "id" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    </>
                  )}
                  <th onClick={() => handleSort("category")}>
                    Category{" "}
                    {sortConfig?.key === "category" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("title")}>
                    Title{" "}
                    {sortConfig?.key === "title" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("status")}>
                    Status{" "}
                    {sortConfig?.key === "status" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("date")}>
                    Date{" "}
                    {sortConfig?.key === "date" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.status);
                  return (
                    <tr
                      key={ticket.globalId}
                      id={`ticket-${ticket.globalId}`}
                      className={
                        highlightId === String(ticket.globalId)
                          ? "highlight"
                          : ""
                      }
                    >
                      {user.role === "Head" && (
                        <td>
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <div
                              className="user-avatar"
                              style={{
                                background: deptAccent.bg,
                                color: deptAccent.color,
                              }}
                            >
                              {String(ticket.createdBy).charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>
                              {ticket.createdBy}
                            </span>
                          </div>
                        </td>
                      )}
                      {user.role === "Head" && (
                        <td style={{ color: "#64748b" }}>#{ticket.id}</td>
                      )}
                      <td style={{ color: "#64748b", fontSize: "13px" }}>
                        {ticket.category}
                      </td>
                      <td style={{ fontWeight: 500 }}>{ticket.title}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: statusColor.bg,
                            borderColor: statusColor.border,
                            color: statusColor.text,
                          }}
                        >
                          <span
                            className="status-dot"
                            style={{ background: statusColor.dot }}
                          />
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "13px" }}>
                        {new Date(ticket.date).toLocaleDateString()} at{" "}
                        {new Date(ticket.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              router.push(
                                `/tickets?highlight=${ticket.globalId}`,
                                { scroll: false },
                              );
                            }}
                            title="View Details"
                          >
                            <svg
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              viewBox="0 0 24 24"
                            >
                              <path d="M2.036 12.322a1.012 1.012 0 010-.644C3.412 8.086 7.21 5 12 5c4.79 0 8.588 3.086 9.964 6.678.331.646.331 1.356 0 2.002C20.588 15.914 16.79 19 12 19c-4.79 0-8.588-3.086-9.964-6.678z" />
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>

                          {user?.role !== "Head" &&
                            ticket.status?.toLowerCase() === "pending" &&
                            String(ticket.createdBy).toLowerCase().trim() ===
                              String(user?.username).toLowerCase().trim() && (
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/tickets/edit?id=${ticket.globalId}`,
                                  );
                                }}
                                title="Edit Ticket"
                              >
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            )}

                          {user.role === "Head" &&
                            ticket.status === "Pending" && (
                              <button
                                className="btn-icon"
                                style={{
                                  background: deptAccent.color,
                                  color: "#ffffff",
                                  border: "none",
                                }}
                                onClick={() =>
                                  handleStatusChange(
                                    ticket.globalId,
                                    "In Progress",
                                  )
                                }
                                title="Accept Ticket"
                              >
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedTickets.length === 0 && (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              <p style={{ fontSize: "14px", margin: 0 }}>
                No tickets found for the selected filter.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {mounted &&
        selectedTicket &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Ticket Details</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-section">
                  <label className="modal-label">Title</label>
                  <div className="modal-field">{selectedTicket.title}</div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">Description</label>
                  <div
                    className="modal-field"
                    style={{
                      minHeight: "120px",
                      maxHeight: "240px",
                      overflowY: "auto",
                      fontStyle: "italic",
                    }}
                  >
                    "{selectedTicket.description || "No description provided."}"
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="modal-section">
                    <label className="modal-label">Status</label>
                    <div
                      className="modal-field"
                      style={{ padding: "10px 14px" }}
                    >
                      <span
                        className="status-badge"
                        style={{
                          background: getStatusColor(selectedTicket.status).bg,
                          borderColor: getStatusColor(selectedTicket.status)
                            .border,
                          color: getStatusColor(selectedTicket.status).text,
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{
                            background: getStatusColor(selectedTicket.status)
                              .dot,
                          }}
                        />
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  <div className="modal-section">
                    <label className="modal-label">Category</label>
                    <div className="modal-field">{selectedTicket.category}</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-close" onClick={handleCloseModal}>
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
