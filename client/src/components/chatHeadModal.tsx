"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config/api";

type Message = {
  id: number;
  ticketId: number;
  sender: string;
  message: string;
  attachment?: string | null;
  created_at: string;
};

type Ticket = {
  globalId: string | number;
  displayId: string;
  title: string;
  user: string;
  status: string;
};

export default function ChatHeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [input, setInput] = useState("");

  const constraintsRef = useRef(null);
  // 🟢 FIXED: Changed from messagesEndRef to a container ref for top-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    try {
      const params = new URLSearchParams();
      if (user.role) params.set("role", user.role);
      if (user.dept) params.set("dept", user.dept);
      if (user.username) params.set("username", user.username);

      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();

        const mappedTickets = data
          .map((t: any, idx: number) => ({
            globalId: t.id,
            displayId: `#${idx + 1}`,
            title: t.title,
            user: t.createdBy,
            status: t.status === "PENDING" ? "pending" : "open",
            rawStatus: t.status,
          }))
          .filter((t: any) => t.rawStatus !== "FINISHED")
          .reverse();

        setTickets(mappedTickets);

        if (!activeTicket && mappedTickets.length > 0) {
          setActiveTicket(mappedTickets[0]);
        }
      }
    } catch (error) {
      console.error("Error loading tickets for chat:", error);
    }
  }, [user, activeTicket]);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 10000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const fetchMessages = useCallback(async () => {
    if (!activeTicket || !isOpen) return;
    try {
      const res = await fetch(
        `${API_URL}/api/chat/${activeTicket.globalId}/messages`,
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [activeTicket, isOpen]);

  useEffect(() => {
    fetchMessages();
    let interval: NodeJS.Timeout;
    if (isOpen && activeTicket) {
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, activeTicket, fetchMessages]);

  // 🟢 FIXED: Auto-scroll to TOP instead of bottom when messages arrive
  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || !activeTicket || !user || isSending) return;

    setIsSending(true);
    const messageText = input;
    setInput("");

    const optimisticMessage: Message = {
      id: Date.now(),
      ticketId: activeTicket.globalId as number,
      sender: user.username,
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(
        `${API_URL}/api/chat/${activeTicket.globalId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: user.username,
            message: messageText,
            attachment: null,
          }),
        },
      );

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none z-[9999] p-4 sm:p-6"
    >
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 font-sans pointer-events-auto origin-bottom-right"
      >
        <div className="absolute bottom-full right-0 mb-3 sm:mb-4">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-[calc(100vw-2rem)] sm:w-[384px] h-[65vh] min-h-[400px] max-h-[600px] sm:h-[550px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="relative p-3 sm:p-4 bg-green-700 text-white flex justify-between items-center shadow-lg z-20">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-green-800 p-1.5 rounded-xl transition-all active:scale-95 flex-1 min-w-0"
                    onClick={() => setShowTicketList(!showTicketList)}
                  >
                    <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-xs sm:text-sm flex items-center gap-1 uppercase tracking-wider truncate">
                        {activeTicket
                          ? `${activeTicket.displayId} - ${activeTicket.title}`
                          : "Select Ticket"}
                        <span className="text-[10px] opacity-70 ml-1">
                          {showTicketList ? "▲" : "▼"}
                        </span>
                      </h3>
                      {activeTicket && (
                        <p className="text-[10px] sm:text-xs opacity-90 font-medium truncate">
                          Creator: {activeTicket.user}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-red-500 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors text-2xl font-light flex-shrink-0"
                  >
                    ×
                  </button>

                  <AnimatePresence>
                    {showTicketList && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[100%] left-2 right-2 sm:left-4 sm:right-auto sm:w-[280px] mt-2 bg-white shadow-2xl rounded-xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Active Tickets
                          </span>
                          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            {tickets.length} Total
                          </span>
                        </div>

                        <div className="max-h-[40vh] sm:max-h-[260px] overflow-y-auto">
                          {tickets.length === 0 && (
                            <p className="text-xs text-gray-400 p-4 text-center">
                              No active tickets found.
                            </p>
                          )}
                          {tickets.map((ticket) => (
                            <div
                              key={ticket.globalId}
                              onClick={() => {
                                setActiveTicket(ticket);
                                setShowTicketList(false);
                              }}
                              className={`p-3 sm:p-4 border-b last:border-0 cursor-pointer flex justify-between items-center hover:bg-green-50 transition-all ${activeTicket?.globalId === ticket.globalId ? "bg-green-50 border-l-4 border-l-green-700" : "border-l-4 border-l-transparent"}`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-800 tracking-tight truncate">
                                  {ticket.displayId} - {ticket.title}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate font-medium mt-0.5">
                                  {ticket.user}
                                </p>
                              </div>
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${ticket.status === "open" ? "bg-emerald-500" : "bg-amber-500"}`}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Chat Area - 🟢 FIXED: Attached chatContainerRef */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-gray-50/50 z-10 relative flex flex-col"
                >
                  {activeTicket ? (
                    <>
                      <div className="text-center py-2 sticky top-0 z-10">
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1 rounded-full shadow-sm uppercase tracking-tighter inline-block">
                          Chat ID: {activeTicket.globalId}
                        </span>
                      </div>

                      {messages.length === 0 && (
                        <p className="text-center text-xs text-gray-400 mt-10">
                          No messages yet. Say hello!
                        </p>
                      )}

                      {/* 🟢 FIXED: Reversed the messages array so new ones appear at the top */}
                      {[...messages].reverse().map((msg) => {
                        const isSystemMsg =
                          msg.sender.toLowerCase() === "system" ||
                          msg.message.toLowerCase().startsWith("system:");

                        if (isSystemMsg) {
                          const displayMessage = msg.message.replace(
                            /^System:\s*/i,
                            "",
                          );
                          return (
                            <div
                              key={msg.id}
                              className="flex justify-center my-3"
                            >
                              <span className="bg-gray-100 text-gray-500 text-[10px] sm:text-[11px] px-4 py-1.5 rounded-full font-medium border border-gray-200 shadow-sm text-center max-w-[90%]">
                                {displayMessage}
                              </span>
                            </div>
                          );
                        }

                        const isMe =
                          user.role === "Head"
                            ? msg.sender !== activeTicket.user
                            : msg.sender === user.username;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            {!isMe && (
                              <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">
                                {msg.sender}
                              </span>
                            )}
                            <motion.div
                              initial={{ scale: 0.95, opacity: 0, y: 5 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-3.5 rounded-2xl text-[13px] sm:text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                                isMe
                                  ? "bg-green-700 text-white rounded-tr-none"
                                  : "bg-white text-gray-700 rounded-tl-none border border-gray-100"
                              }`}
                            >
                              {msg.attachment && (
                                <img
                                  src={msg.attachment}
                                  alt="Attachment"
                                  className="max-h-[160px] sm:max-h-[200px] w-auto object-contain rounded-lg mb-2 bg-black/5"
                                />
                              )}
                              {msg.message}
                            </motion.div>
                            <span className="text-[9px] text-gray-400 mt-1 mx-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm font-bold text-gray-400">
                      Please select a ticket to start chatting.
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex gap-2 items-center z-20">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    disabled={!activeTicket || isSending}
                    placeholder={
                      activeTicket ? "Message..." : "Select a ticket first"
                    }
                    className="flex-1 text-[16px] sm:text-sm focus:outline-none text-gray-700 bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!activeTicket || !input.trim() || isSending}
                    className="bg-green-600 text-white p-2.5 sm:p-3 rounded-xl hover:bg-green-700 transition-all active:scale-90 shadow-md shadow-green-200/50 flex-shrink-0 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          layout="position"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-green-700 shadow-2xl shadow-green-700/30 flex items-center justify-center relative transition-all duration-300 float-right ${
            isOpen
              ? "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl"
              : "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[24px]"
          }`}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 sm:h-7 sm:w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 sm:h-8 sm:w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              {tickets.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-[11px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white font-bold shadow-lg">
                  {tickets.length}
                </span>
              )}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
