"use client";

import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import { getRelativeTime } from "../../lib/utils";

export default function RoleBasedDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState("just now");

  const loadTickets = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);

    try {
      const res = await fetch("http://localhost:3001/api/tickets");
      if (res.ok) {
        const allTickets = await res.json();

        // Forget localStorage for a second—let's see what the server says
        const filtered = allTickets.filter((t: any) => {
          if (parsedUser.role === "Head") return t.dept === parsedUser.dept;
          return t.createdBy === parsedUser.username;
        });

        setTickets(filtered);
        console.log(
          "DEBUG - Latest Ticket Date:",
          filtered[0]?.lastUpdated || filtered[0]?.date,
        );
        console.log("DEBUG - Current Time:", new Date().toISOString());
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  }, []);

  // 2. Timer effect for "Time Ago"
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor(
        (new Date().getTime() - lastUpdated.getTime()) / 1000,
      );

      if (seconds < 60) setTimeAgo("just now");
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    }, 10000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // 3. Initial Auth check and data load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    loadTickets(); // Now it can find the function!
  }, [router, loadTickets]);

  useEffect(() => {
    window.addEventListener("focus", loadTickets);
    return () => window.removeEventListener("focus", loadTickets);
  }, [loadTickets]);

  const pendingCount = tickets.filter((t) => t.status === "Pending").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "In Progress",
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  // Determine the last activity date to show in "Updated X ago"
  const latestTicket = [...tickets].sort((a, b) => {
    const timeB = new Date(b.lastUpdated || b.date).getTime();
    const timeA = new Date(a.lastUpdated || a.date).getTime();
    return timeB - timeA;
  })[0];

  const displayDate = latestTicket
    ? latestTicket.lastUpdated || latestTicket.date
    : new Date().toISOString();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.dept} {user.role} Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Last activity detected {getRelativeTime(displayDate)}
                </p>
              </div>

              {/* Primary Action Button moved here */}
              {user.role === "User" ? (
                <button
                  onClick={() => router.push("/tickets/create")}
                  className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Create New Ticket
                </button>
              ) : (
                <button
                  onClick={() => router.push("/tickets")}
                  className="bg-indigo-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-indigo-700 transition shadow-md"
                >
                  Manage Queue
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Profile Card */}
              <div
                className={`p-6 rounded-xl border flex flex-col justify-between ${
                  user.dept === "Nursing"
                    ? "bg-red-50 border-red-100"
                    : user.dept === "IT"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-green-50 border-green-100"
                }`}
              >
                <div>
                  <h3
                    className={`text-lg font-semibold uppercase tracking-wider mb-4 ${
                      user.dept === "Nursing" ? "text-red-700" : "text-blue-700"
                    }`}
                  >
                    My Profile
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>User:</strong> {user.username}
                    </p>
                    <p>
                      <strong>Access:</strong> {user.role}
                    </p>
                    <p>
                      <strong>Dept:</strong> {user.dept}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tickets Card */}
              {/* 1. Status Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Pending Card */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                        Pending
                      </p>
                      <p className="text-4xl font-bold text-gray-900 mt-1">
                        {pendingCount}
                      </p>
                    </div>
                    <button
                      onClick={loadTickets}
                      className="text-gray-400 hover:text-yellow-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Awaiting response
                  </p>
                </div>

                {/* In Progress Card */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    In Progress
                  </p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">
                    {inProgressCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Currently working
                  </p>
                </div>

                {/* Resolved Card */}
                <div className="bg-white p-6 rounded-xl border-l-4 border-green-500 shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Resolved
                  </p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">
                    {resolvedCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Completed tasks
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
              <p className="text-slate-500 text-sm italic">
                Currently showing filtered results for the{" "}
                <strong>{user.dept}</strong> department.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
