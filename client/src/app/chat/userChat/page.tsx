"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Paperclip, X, Camera, Image as ImageIcon, Send } from "lucide-react";
import { API_URL } from "../../../config/api";

export default function UserChatPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);

  const formatStatus = (s: string) => {
    if (s === "IN_PROGRESS") return "In Progress";
    if (s === "PENDING") return "Pending";
    if (s === "RESOLVED") return "Resolved";
    if (s === "FINISHED") return "Finished";
    return "Open";
  };

  const fetchTickets = useCallback(async (currentUser: any) => {
    if (!currentUser || !currentUser.username) return;
    try {
      const res = await fetch(
        `${API_URL}/api/tickets?role=User&username=${currentUser.username}`,
      );
      if (res.ok) {
        const data = await res.json();
        const formattedTickets = data.map((t: any, index: number) => ({
          globalId: t.id,
          id: index + 1,
          title: t.title || "No Title",
          status: formatStatus(t.status),
          preview: t.description || "No description...",
          category: t.category || "General",
          senderName: t.createdBy,
          department: t.dept,
          date: new Date(t.createdAt).toLocaleDateString(),
          updatedAt: t.updatedAt || t.createdAt,
          reminder_flag: t.reminder_flag || 0,
          unreadCount: t.unreadCount || 0,
          isTyping: false,
        }));
        setTickets(formattedTickets);

        setSelectedTicket((prev: any) => {
          if (!prev) return prev;
          const updatedTicket = formattedTickets.find(
            (t: any) => t.globalId === prev.globalId,
          );
          if (updatedTicket && updatedTicket.status !== prev.status) {
            return { ...prev, status: updatedTicket.status };
          }
          return prev;
        });
      }
    } catch (error: any) {}
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (error: any) {
      if (error.name === "TypeError" && error.message === "Failed to fetch")
        return;
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTickets(parsedUser);

      const ticketInterval = setInterval(() => {
        fetchTickets(parsedUser);
      }, 5000);

      return () => clearInterval(ticketInterval);
    }
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.globalId);

    const messageInterval = setInterval(() => {
      fetchMessages(selectedTicket.globalId);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [selectedTicket, fetchMessages]);

  useEffect(() => {
    if (!selectedTicket || !user) return;
    const checkTypingStatus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/chat/${selectedTicket.globalId}/typing?currentUser=${user.username}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIsOpponentTyping(data.isTyping);
          setTickets((currentTickets) =>
            currentTickets.map((t) =>
              t.globalId === selectedTicket.globalId
                ? { ...t, isTyping: data.isTyping }
                : t,
            ),
          );
        }
      } catch (error) {}
    };

    const typingInterval = setInterval(checkTypingStatus, 2000);
    return () => clearInterval(typingInterval);
  }, [selectedTicket, user]);

  useEffect(() => {
    if (chatHistory.length > lastMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setLastMessageCount(chatHistory.length);
    } else if (chatHistory.length < lastMessageCount) {
      setLastMessageCount(chatHistory.length);
    }
  }, [chatHistory, lastMessageCount]);

  const selectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setChatHistory([]);
    setLastMessageCount(0);
    setIsInfoOpen(false);

    await fetchMessages(ticket.globalId);

    try {
      const readerName = user?.username || "User";
      await fetch(`${API_URL}/api/chat/${ticket.globalId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: readerName }),
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.globalId === ticket.globalId ? { ...t, unreadCount: 0 } : t,
        ),
      );
    } catch (error) {}
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const originalBase64 = event.target?.result as string;
        const compressed = await compressImage(originalBase64);
        setFilePreview(compressed);
      };
      reader.readAsDataURL(file);
    }
    setIsAttachmentMenuOpen(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!selectedTicket || selectedTicket.status === "Finished") return;

    const now = Date.now();
    const currentUsername = user?.username || "User";

    if (now - lastPingRef.current > 1500) {
      lastPingRef.current = now;
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUsername,
          isTyping: true,
        }),
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUsername,
          isTyping: false,
        }),
      });
    }, 2500);
  };

  const handleSend = async () => {
    if (
      (messageInput.trim() || filePreview) &&
      selectedTicket &&
      selectedTicket.status !== "Finished"
    ) {
      const currentUsername = user?.username || "User";
      const payload = {
        sender: currentUsername,
        message: messageInput.trim(),
        attachment: filePreview,
      };

      const optimisticMsg = {
        id: Date.now(),
        ticketId: selectedTicket.globalId,
        sender: payload.sender,
        message: payload.message,
        attachment: payload.attachment,
        created_at: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, optimisticMsg]);
      setMessageInput("");
      removeFile();

      lastPingRef.current = 0;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      try {
        await fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUsername,
            isTyping: false,
          }),
        });

        await fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        fetchMessages(selectedTicket.globalId);
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  const deleteMessage = async (messageId: any) => {
    if (!messageId) return;
    if (window.confirm("Delete this message for everyone?")) {
      try {
        await fetch(`${API_URL}/api/chat/messages/${messageId}`, {
          method: "DELETE",
        });
        setChatHistory((prev) =>
          prev.filter((msg) => String(msg.id) !== String(messageId)),
        );
      } catch (error) {}
    }
  };

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

  const getStatusColor = (status: string) => {
    if (status === "Pending")
      return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "In Progress")
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (status === "Resolved")
      return "bg-green-50 text-green-700 border-green-200";
    if (status === "Finished")
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <>
      <div className="responsive-chat flex flex-col h-[calc(100dvh-60px)] lg:h-[calc(100vh-72px)] bg-white lg:rounded-xl border-t lg:border border-slate-200 shadow-sm overflow-hidden text-slate-900 w-full max-w-[100vw]">
        <div className="flex flex-1 overflow-hidden relative w-full h-full max-w-full">
          {/* 1. LEFT SIDEBAR */}
          <div
            className={`${selectedTicket ? "hidden md:flex" : "flex"} w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col flex-shrink-0 z-20`}
          >
            <div className="p-4 md:p-5 border-b border-green-800 bg-green-700 text-white shadow-sm z-10 flex-shrink-0">
              <h1 className="font-black text-lg md:text-xl tracking-tight">
                My Support
              </h1>
              <p className="text-[10px] text-green-200 uppercase tracking-widest font-semibold mt-0.5">
                Ticket History
              </p>
            </div>

            <div className="flex bg-slate-100 border-b border-slate-200 p-2 gap-2 shadow-inner flex-shrink-0">
              <button
                onClick={() => {
                  setActiveTab("active");
                  setSelectedTicket(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "active" ? "bg-white text-green-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setActiveTab("archived");
                  setSelectedTicket(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "archived" ? "bg-white text-slate-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
              >
                Archive
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 smooth-scroll">
              {displayedTickets.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center opacity-60">
                  <span className="text-sm font-semibold text-slate-500">
                    No tickets found
                  </span>
                </div>
              ) : (
                displayedTickets.map((ticket) => (
                  <div
                    key={ticket.globalId}
                    onClick={() => selectTicket(ticket)}
                    className={`custom-ticket-item relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${selectedTicket?.globalId === ticket.globalId ? "bg-white border-green-500 shadow-md ring-1 ring-green-500/20" : "bg-white border-slate-200 shadow-sm hover:border-green-300 hover:shadow-md"}`}
                  >
                    {(ticket.reminder_flag === 1 || ticket.unreadCount > 0) &&
                      activeTab === "active" && (
                        <div
                          className={`absolute -top-2 -right-1 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white z-20 shadow-md ${ticket.reminder_flag === 1 ? "bg-[#ef4444] animate-highlight" : "bg-[#16a34a]"}`}
                          style={{ border: "2px solid white" }}
                        >
                          {ticket.unreadCount > 0 ? ticket.unreadCount : "!"}
                        </div>
                      )}
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center flex-1 min-w-0 mr-2">
                        <span className="text-[10px] font-black text-slate-400 mr-1.5 flex-shrink-0">
                          #{ticket.id}
                        </span>
                        <h3
                          className={`text-sm font-bold truncate ${selectedTicket?.globalId === ticket.globalId ? "text-green-700" : "text-slate-800"}`}
                        >
                          {ticket.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border flex-shrink-0 ${getStatusColor(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    {ticket.isTyping ? (
                      <div className="flex items-center gap-1.5 mt-1 animate-fadeIn">
                        <span className="flex gap-0.5 items-center bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                          <span
                            className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                            style={{ animationDelay: "-0.3s" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                            style={{ animationDelay: "-0.15s" }}
                          ></span>
                          <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></span>
                        </span>
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter truncate">
                          Admin is typing...
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">
                          {ticket.department}
                        </span>
                        <span className="text-slate-400 font-medium truncate ml-2">
                          {ticket.date}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. MAIN CHAT AREA */}
          <div
            className={`${!selectedTicket ? "hidden md:flex" : "flex"} flex-1 flex-col bg-white h-full relative z-10 overflow-hidden w-full max-w-full`}
          >
            {selectedTicket ? (
              <>
                <div className="h-14 border-b border-amber-200 shadow-sm flex justify-between items-center bg-white z-10 px-3 md:px-4 flex-shrink-0 w-full">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="md:hidden p-1.5 text-green-600 flex-shrink-0"
                    >
                      <X size={22} />
                    </button>
                    <div className="flex flex-col truncate flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 min-w-0">
                        <h2 className="custom-header-title font-bold text-sm text-slate-800 truncate">
                          {selectedTicket.title}
                        </h2>
                        <span
                          className={`hidden sm:inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shadow-sm flex-shrink-0 ${getStatusColor(selectedTicket.status)}`}
                        >
                          {selectedTicket.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                        Ticket #{selectedTicket.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsInfoOpen(true)}
                    className="xl:hidden p-2 text-green-600 hover:bg-green-50 rounded-full flex-shrink-0 ml-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 space-y-4 smooth-scroll w-full">
                  {chatHistory.map((msg) => {
                    if (msg.sender === "System") {
                      let displayMessage = msg.message;
                      let isReminder = false;
                      if (displayMessage.startsWith("SYS_REMINDER|")) {
                        isReminder = true;
                        displayMessage =
                          "🔔 Reminder Sent: The admin has been notified.";
                      }
                      return (
                        <div key={msg.id} className="flex justify-center my-4">
                          <span
                            className={`text-[9px] px-4 py-2 rounded-full font-bold uppercase tracking-wider shadow-sm border text-center max-w-[90%] leading-relaxed ${isReminder ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                          >
                            {displayMessage}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`flex group items-end ${msg.sender === user?.username ? "justify-end gap-1.5" : "justify-start"}`}
                      >
                        {msg.sender === user?.username &&
                          selectedTicket.status !== "Finished" && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full flex-shrink-0 mb-2"
                            >
                              <X size={14} />
                            </button>
                          )}
                        <div className="flex flex-col max-w-[80%] md:max-w-md">
                          <div
                            className={`p-3 rounded-2xl shadow-sm relative leading-relaxed ${msg.sender === user?.username ? "bg-green-600 text-white rounded-tr-none" : "bg-white border border-amber-200 text-slate-900 rounded-tl-none"}`}
                          >
                            <p
                              className={`font-black text-[8px] mb-1 uppercase tracking-wider ${msg.sender === user?.username ? "text-green-200" : "text-amber-600"}`}
                            >
                              {msg.sender === user?.username
                                ? "You"
                                : msg.sender}
                            </p>
                            {msg.attachment && (
                              <img
                                src={msg.attachment}
                                alt="Attachment"
                                className="max-w-full h-auto rounded-lg mb-1.5 cursor-pointer border border-black/10 active:opacity-50"
                                onClick={() =>
                                  setFullScreenImage(msg.attachment)
                                }
                              />
                            )}
                            <p className="custom-message-text text-sm whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isOpponentTyping && (
                    <div className="flex justify-start items-end gap-2 mt-2 animate-fadeIn">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-[10px] border border-indigo-200 flex-shrink-0 shadow-sm">
                        A
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1 w-fit">
                          <span
                            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-2 md:p-3 border-t border-slate-200 bg-white flex-shrink-0 z-50 w-full box-border">
                  {selectedTicket.status === "Finished" ? (
                    <div className="w-full bg-slate-100 text-slate-400 text-xs font-bold text-center py-3 rounded-xl border border-slate-200 uppercase tracking-widest select-none">
                      Ticket is closed.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      {filePreview && (
                        <div className="relative self-start mb-1 animate-fadeIn">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="h-16 w-auto rounded-lg border border-slate-200 object-cover shadow-sm"
                          />
                          <button
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-900 transition shadow-md"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      <div className="custom-input-pill flex items-center bg-slate-100 p-1 sm:p-1.5 rounded-full border border-slate-200 focus-within:border-green-400 transition-colors relative w-full shadow-sm box-border">
                        {isAttachmentMenuOpen && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsAttachmentMenuOpen(false)}
                          />
                        )}

                        {isAttachmentMenuOpen && (
                          <div className="absolute bottom-[110%] left-0 bg-white border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl p-1 flex flex-col w-40 animate-popOut z-50 origin-bottom-left">
                            <button
                              onClick={() => {
                                galleryInputRef.current?.click();
                                setIsAttachmentMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700"
                            >
                              <ImageIcon size={16} className="text-blue-500" />{" "}
                              Photo Library
                            </button>
                            <button
                              onClick={() => {
                                cameraInputRef.current?.click();
                                setIsAttachmentMenuOpen(false);
                              }}
                              className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                            >
                              <Camera size={16} className="text-emerald-500" />{" "}
                              Take Photo
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() =>
                            setIsAttachmentMenuOpen(!isAttachmentMenuOpen)
                          }
                          className={`p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-green-200 text-green-800" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
                        >
                          <Paperclip size={18} />
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={galleryInputRef}
                          onChange={handleFileSelect}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          ref={cameraInputRef}
                          onChange={handleFileSelect}
                        />

                        <input
                          value={messageInput}
                          onChange={handleTyping}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Type message..."
                          className="custom-input-text flex-1 w-full min-w-0 bg-transparent px-2 py-2 text-[13px] md:text-sm focus:outline-none relative z-10 text-slate-800 placeholder-slate-400"
                        />

                        <button
                          onClick={handleSend}
                          disabled={!messageInput.trim() && !filePreview}
                          className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 ${messageInput.trim() || filePreview ? "bg-green-600 text-white shadow-md active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                          title="Send message"
                        >
                          <Send size={14} className="custom-send-icon ml-0.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm bg-slate-50/50">
                <p className="font-semibold text-sm">Select a ticket</p>
              </div>
            )}
          </div>

          {/* 3. RIGHT SIDEBAR DETAILS */}
          {selectedTicket && (
            <>
              {isInfoOpen && (
                <div
                  className="fixed inset-0 bg-slate-900/60 z-[50] xl:hidden"
                  onClick={() => setIsInfoOpen(false)}
                />
              )}
              <div
                className={`absolute right-0 top-0 h-full w-[260px] bg-white z-[60] transition-transform duration-300 ease-in-out shadow-2xl ${isInfoOpen ? "translate-x-0" : "translate-x-full"} xl:static xl:translate-x-0 xl:flex xl:flex-col xl:w-72 xl:border-l xl:border-slate-200 xl:bg-white xl:shadow-none`}
              >
                <div className="p-5 h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 xl:hidden">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Information
                    </h3>
                    <button
                      onClick={() => setIsInfoOpen(false)}
                      className="p-1.5 bg-slate-100 rounded-full text-slate-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <h3 className="hidden xl:block font-bold text-xs mb-6 text-slate-400 uppercase tracking-widest">
                    Ticket Info
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                        Status
                      </p>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(selectedTicket.status)}`}
                      >
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                        Ticket ID
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        #{selectedTicket.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                        Category
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {selectedTicket.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                        Date Created
                      </p>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        {selectedTicket.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🟢 FULL SCREEN IMAGE MODAL */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <a
            href={fullScreenImage}
            download="attachment.jpg"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-10 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold uppercase tracking-widest rounded-full transition-colors backdrop-blur-md"
          >
            Download Image
          </a>
          <img
            src={fullScreenImage}
            alt="Full screen"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 🟢 FULLY POPULATED MEDIA QUERIES FOR SMALL SCREENS */}
      <style>{`
        .responsive-chat { margin-left: 0px; width: 100vw; max-width: 100vw; transition: margin-left 0.3s ease-in-out, width 0.3s ease-in-out; overflow-x: hidden; } 
        @media (min-width: 768px) { .responsive-chat { width: 100%; max-width: 100%; margin-left: var(--sidebar-width, 256px); width: calc(100% - var(--sidebar-width, 256px)); } }
        
        .smooth-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .smooth-scroll::-webkit-scrollbar { display: none; }
        @keyframes popOut { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popOut { animation: popOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* 📱 Extremely Small Phones (e.g., older Androids, iPhone SE) */
        @media (max-width: 360px) { 
          .custom-input-pill { padding: 4px !important; gap: 2px !important; }
          .custom-input-text { font-size: 11px !important; padding-left: 4px !important; padding-right: 4px !important; }
          .custom-send-btn { width: 28px !important; height: 28px !important; }
          .custom-send-icon { width: 12px !important; height: 12px !important; margin-left: 0 !important; }
          .custom-message-text { font-size: 12px !important; }
          .custom-header-title { font-size: 12px !important; }
          .custom-ticket-item { padding: 8px !important; }
        }

        /* 📱 Standard Small Androids (like Infinix) */
        @media (max-width: 390px) { 
          .custom-input-pill { padding: 6px !important; }
          .custom-input-text { font-size: 12px !important; }
          .custom-message-text { font-size: 13px !important; }
        }

        /* 📱 Large Phones */
        @media (max-width: 430px) { 
          /* Base mobile classes apply naturally */
        }
      `}</style>
    </>
  );
}
