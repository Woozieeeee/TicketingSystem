"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  user: {
    id: string; // Added id for the API fetch
    username: string;
    role: string;
    dept: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Added missing state
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (
    notifId: string,
    ticketGlobalId: string,
  ) => {
    try {
      // 1. Close the dropdown immediately
      setNotificationOpen(false);

      // 2. Optimistic Update: Use is_read (snake_case) to match your state logic
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)),
      );

      // 3. API Call
      await fetch(`http://localhost:3001/api/notifications/${notifId}/read`, {
        method: "PATCH",
      });

      // 4. Navigate
      router.push(`/tickets?highlight=${ticketGlobalId}`);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };
  // Fetch Notifications
  // Inside Navbar.tsx component
  useEffect(() => {
    // Guard clause: stop if no username is available
    if (!user?.username) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        // Use encodeURIComponent to handle special characters in usernames
        const res = await fetch(
          `http://localhost:3001/api/notifications/${encodeURIComponent(user.username)}`,
        );

        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };

    fetchNotifications();
    // Poll every 10 seconds for testing (change to 30000 for production)
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.username]); // Updated dependency

  const unreadCount = notifications.filter((n) => n.is_read === false).length;

  return (
    <nav
      className="z-[999] text-white shadow-md border-b border-gray-200 px-6 py-3 flex justify-between items-center relative"
      style={{ backgroundColor: "#15803d" }}
    >
      {/* LEFT SIDE: Logo */}
      <div className="flex items-center">
        <h1
          className="text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/dashboard")}
        >
          Ticketing System
        </h1>
      </div>

      {/* Notification Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          suppressHydrationWarning
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="btn btn-ghost btn-circle text-white hover:bg-green-700 transition"
        >
          <div className="indicator">
            {unreadCount > 0 && (
              <span
                className="indicator-item badge badge-error badge-xs flex h-4 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                style={{
                  position: "absolute",
                  top: "-10px", // Moves it slightly above the bell
                  right: "-10px", // Moves it slightly to the right of the bell
                  zIndex: 10,
                  backgroundColor: "#ff0000", // Matches your navbar green to create a "cutout" look
                  border: "2px solid #ffffff", // Matches your navbar green to create a "cutout" look
                }}
              >
                {unreadCount}
              </span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </button>

        {notificationOpen && (
          <div
            className="absolute right-0 mt-2 w-80 bg-white text-black shadow-2xl rounded-lg border"
            style={{ zIndex: 100, width: "300px", borderColor: "#5c5b5b" }}
          >
            <div
              className="p-3 font-bold border-b flex justify-between items-center border-gray-100"
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid #9b8e8e",
              }}
            >
              <span className="text-gray-700">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-red-500">{unreadCount} New</span>
              )}
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    // Note: check if your data uses is_read or isRead and match it here
                    className={`p-3 border-b hover:bg-gray-100 cursor-pointer ${!n.is_read ? "bg-blue-50 font-semibold" : ""}`}
                    onClick={() =>
                      handleNotificationClick(n.id, n.ticketGlobalId)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 shadow-sm" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-gray-400 text-sm italic">
                  No new notifications
                </li>
              )}
            </ul>
            <div className="p-2 text-center border-t bg-gray-50 rounded-b-lg">
              <button className="text-xs text-blue-600 font-bold hover:underline">
                View all
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
