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
      const res = await fetch("http://localhost:3001/api/tickets/");
      if (res.ok) {
        const serverTickets = await res.json();
        // Transform API response to match UI expectations
        const transformed = serverTickets.map((t: any) => ({
          globalId: t.id, // Map 'id' from API to 'globalId' for UI
          id: Math.random(), // Generate a numeric id for table display
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
    // 1. Clear the URL first
    router.push("/tickets", { scroll: false });

    // 2. Use a tiny timeout to let the router update
    // before we wipe the selectedTicket state
    setTimeout(() => {
      setSelectedTicket(null);
    }, 50);
  };

  useEffect(() => {
    // If there is NO highlight ID in the URL, but a ticket is still "selected"
    // it means the user either clicked 'Back' or we cleared the URL.
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

  // Lock scrolling when modal is open
  useEffect(() => {
    if (selectedTicket) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (highlightId && sortedTickets.length > 0) {
      // Find the ticket that matches the ID from the notification
      const ticketToHighlight = sortedTickets.find(
        (t) => String(t.globalId) === String(highlightId),
      );

      if (ticketToHighlight) {
        setSelectedTicket(ticketToHighlight); // 3. Auto-open the modal

        // Optional: Scroll the row into view if the list is long
        const element = document.getElementById(`ticket-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [highlightId, sortedTickets]);

  const handleStatusChange = (globalId: string | number, newStatus: string) => {
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

  if (!mounted || isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <main
        style={{
          flex: 1,
          marginLeft: "260px", // Matches the width of the sidebar
          backgroundColor: "#f8fafc",
          padding: "40px",
        }}
      >
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Ticket Management
              </h2>
              {user.role !== "Head" && (
                <button
                  onClick={() => router.push("/tickets/create")}
                  className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Create New Ticket
                </button>
              )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-8 border-b border-gray-100 mb-6">
              {["All", "Pending", "In Progress", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-2 ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    {tab === "All"
                      ? filteredByRole.length
                      : filteredByRole.filter((t) => t.status === tab).length}
                  </span>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      ...(user.role === "Head"
                        ? [
                            { label: "Sender", key: "createdBy" },
                            { label: "ID", key: "id" },
                          ]
                        : []),

                      { label: "Category", key: "category" },
                      { label: "Title", key: "title" },
                      { label: "Status", key: "status" },
                      { label: "Date", key: "date" },
                    ].map((header) => (
                      <th
                        key={header.key}
                        onClick={() => handleSort(header.key as keyof Ticket)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          {header.label}{" "}
                          {sortConfig?.key === header.key &&
                            (sortConfig.direction === "asc" ? "🔼" : "🔽")}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTickets.map((ticket) => (
                    <tr
                      key={ticket.globalId}
                      id={`ticket-${ticket.globalId}`} // 4. Add ID for scrolling
                      className={`transition-all duration-500 ${
                        highlightId === String(ticket.globalId)
                          ? "bg-blue-50 border-l-4 border-blue-600 shadow-inner" // 5. Add highlight style
                          : "hover:bg-gray-50/50"
                      }`}
                    >
                      {user.role === "Head" && (
                        <td className="px-6 py-4 text-sm text-gray-900">
                          #{ticket.id}
                        </td>
                      )}
                      {user.role === "Head" && (
                        <td className="px-6 py-4 text-sm font-semibold text-blue-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 uppercase">
                              {String(ticket.createdBy).charAt(0)}
                            </div>
                            {ticket.createdBy}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ticket.category || "General"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            ticket.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : ticket.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ticket.date).toLocaleDateString()} at{" "}
                        {new Date(ticket.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="relative z-20 flex items-center gap-3 min-w-[100px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents row click events
                              setSelectedTicket(ticket);
                              // Update URL with highlight param to prevent auto-close
                              router.push(
                                `/tickets?highlight=${ticket.globalId}`,
                                { scroll: false },
                              );
                            }}
                            className="px-2 py-1 bg-green-600 text-white border border-green-700 hover:bg-green-700 rounded-lg shadow-sm transition-all active:scale-95 group"
                            title="View Details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.644C3.412 8.086 7.21 5 12 5c4.79 0 8.588 3.086 9.964 6.678.331.646.331 1.356 0 2.002C20.588 15.914 16.79 19 12 19c-4.79 0-8.588-3.086-9.964-6.678z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>

                          {user?.role !== "Head" &&
                            ticket.status?.toLowerCase() === "pending" &&
                            String(ticket.createdBy).toLowerCase().trim() ===
                              String(user?.username).toLowerCase().trim() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/tickets/edit?id=${ticket.globalId}`,
                                  );
                                }}
                                className="px-2 py-1 bg-green-600 text-white border border-green-700 hover:bg-green-700 rounded-lg shadow-sm transition-all active:scale-95 group"
                                title="Edit Ticket"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                  />
                                </svg>
                              </button>
                            )}

                          {/* If user is Head, show the Accept/Action button next to the eye */}
                          {user.role === "Head" &&
                            ticket.status === "Pending" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    ticket.globalId,
                                    "In Progress",
                                  )
                                }
                                className="text-xs font-bold text-green-600 hover:text-green-700 underline underline-offset-4"
                              >
                                Accept
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {mounted &&
        selectedTicket &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 1000,
              width: "100vw", // Force full width for the dim effect
              height: "100vh", // Force full height
              backgroundColor: "rgba(0, 0, 0, 0.4)", // This creates the DIM effect
              backdropFilter: "blur(0.5px)", // This creates the BLUR effect
            }}
          >
            {/* THE ACTUAL MODAL BOX */}
            <div
              className="relative bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
              style={{
                width: "500px", // Strict width for the card only
                maxHeight: "90vh", // Prevents it from being taller than the screen
                zIndex: 10000,
              }}
            >
              {/* Header */}
              <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                <h3 className="text-xl font-black text-slate-900">
                  Ticket Details
                </h3>
                <button
                  onClick={handleCloseModal} // Use the new function
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="text-center">
                  <label className="text-[10px] uppercase font-black text-blue-600 tracking-widest block mb-2">
                    Title
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800">
                    {selectedTicket.title}
                  </div>
                </div>

                <div className="text-center">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-2">
                    Description
                  </label>
                  <div
                    className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-600 italic leading-relaxed"
                    style={{
                      wordBreak: "break-all", // Forces the "asdddd..." to wrap
                      whiteSpace: "pre-wrap", // Preserves line breaks
                      width: "100%", // Keeps it inside the 500px card
                      maxHeight: "40vh",
                      overflowY: "auto",
                      display: "block", // Ensures it behaves as a container
                    }}
                  >
                    "{selectedTicket.description || "No description provided."}"
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8">
                <button
                  onClick={handleCloseModal} // Use the new function
                  className="w-full py-4 mb-6 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                >
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
