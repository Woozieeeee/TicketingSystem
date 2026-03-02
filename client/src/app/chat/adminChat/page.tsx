"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Paperclip,
  X,
  Camera,
  Image as ImageIcon,
  Send,
  Mic,
  Square,
  Video,
  Play,
  Trash2,
  Ban,
  ArrowLeft,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";

interface Ticket {
  globalId: string;
  id: number;
  title: string;
  user: string;
  status: string;
  department: string;
  category: string;
  date: string;
  preview: string;
  updatedAt: string;
  reminder_flag: number;
  unreadCount: number;
  isTyping?: boolean;
}

const CustomAudioPlayer = ({ src, isMe }: { src: string; isMe: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100,
      );
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (seekTo / 100) * duration;
      setProgress(seekTo);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl w-[200px] sm:w-[240px] mb-2 ${
        isMe
          ? "bg-black/10 text-white"
          : "bg-slate-100 border border-slate-200 text-slate-700"
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
          isMe
            ? "bg-white text-slate-800"
            : "bg-white text-slate-700 shadow-sm border border-slate-200"
        }`}
      >
        {isPlaying ? (
          <Square size={12} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1 w-full">
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progress) ? 0 : progress}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current"
          style={{
            background: isMe
              ? `linear-gradient(to right, white ${progress}%, rgba(0,0,0,0.2) ${progress}%)`
              : `linear-gradient(to right, #64748b ${progress}%, #cbd5e1 ${progress}%)`,
          }}
        />
        <div
          className={`text-[9px] font-bold flex justify-between mt-0.5 ${
            isMe ? "text-white/80" : "text-slate-500"
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminChatPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "audio" | null>(
    null,
  );
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isSending, setIsSending] = useState(false);

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
    if (!currentUser || !currentUser.dept) return;
    try {
      const res = await fetch(
        `${API_URL}/api/tickets?role=Head&dept=${currentUser.dept}`,
      );
      if (res.ok) {
        const data = await res.json();
        const formattedTickets = data.map((t: any, index: number) => ({
          globalId: t.id,
          id: index + 1,
          title: t.title || "No Title",
          user: t.createdBy,
          department: t.dept,
          status: formatStatus(t.status),
          category: t.category || "General",
          date: new Date(t.createdAt).toLocaleDateString(),
          preview: t.description || "No description...",
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
    } catch (error: any) {}
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTickets(parsedUser);
      const ticketInterval = setInterval(() => fetchTickets(parsedUser), 5000);
      return () => clearInterval(ticketInterval);
    }
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.globalId);
    const messageInterval = setInterval(
      () => fetchMessages(selectedTicket.globalId),
      3000,
    );
    return () => clearInterval(messageInterval);
  }, [selectedTicket, fetchMessages]);

  useEffect(() => {
    if (!selectedTicket) return;
    const checkTypingStatus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/chat/${selectedTicket.globalId}/typing?currentUser=Support Admin`,
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
  }, [selectedTicket]);

  useEffect(() => {
    if (chatHistory.length > lastMessageCount) {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
    removeFile();

    await fetchMessages(ticket.globalId);

    try {
      await fetch(`${API_URL}/api/chat/${ticket.globalId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: "Support Admin" }),
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
      if (file.type.startsWith("video/")) {
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
          setFileType("video");
        };
      } else if (file.type.startsWith("image/")) {
        reader.onload = async (event) => {
          const originalBase64 = event.target?.result as string;
          const compressed = await compressImage(originalBase64);
          setFilePreview(compressed);
          setFileType("image");
        };
      }
      reader.readAsDataURL(file);
    }
    setIsAttachmentMenuOpen(false);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Microphone access blocked! Browsers require HTTPS or 'localhost' to record audio.",
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
          setFileType("audio");
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access the microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const parseAttachment = (attachmentStr: string | null | undefined) => {
    if (!attachmentStr) return { type: null, src: null };
    if (attachmentStr.startsWith("[video]"))
      return { type: "video", src: attachmentStr.replace("[video]", "") };
    if (attachmentStr.startsWith("[audio]"))
      return { type: "audio", src: attachmentStr.replace("[audio]", "") };
    if (attachmentStr.startsWith("[image]"))
      return { type: "image", src: attachmentStr.replace("[image]", "") };
    return { type: "image", src: attachmentStr };
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!selectedTicket || selectedTicket.status === "Finished") return;

    const now = Date.now();

    if (now - lastPingRef.current > 1500) {
      lastPingRef.current = now;
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Support Admin", isTyping: true }),
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Support Admin", isTyping: false }),
      });
    }, 2500);
  };

  const handleSend = async () => {
    if (
      (!messageInput.trim() && !filePreview) ||
      !selectedTicket ||
      selectedTicket.status === "Finished" ||
      isSending
    )
      return;

    setIsSending(true);

    let finalAttachment = filePreview;
    if (filePreview && fileType) {
      finalAttachment = `[${fileType}]${filePreview}`;
    }

    const payload = {
      sender: "Support Admin",
      message: messageInput.trim(),
      attachment: finalAttachment,
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
        body: JSON.stringify({ username: "Support Admin", isTyping: false }),
      });

      await fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchMessages(selectedTicket.globalId);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  // 🟢 NEW: Delete Message Logic
  const deleteMessage = async (messageId: number) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This will remove the content for everyone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/api/chat/messages/${messageId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setChatHistory((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, message: "[DELETED]", attachment: null }
                : msg,
            ),
          );
        }
      } catch (error) {
        console.error("Delete failed", error);
      }
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
        const aHasReminder =
          a.reminder_flag === 1 && a.status !== "In Progress";
        const bHasReminder =
          b.reminder_flag === 1 && b.status !== "In Progress";

        if (aHasReminder && !bHasReminder) return -1;
        if (!aHasReminder && bHasReminder) return 1;
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
      <div
        className="responsive-chat flex flex-col h-[calc(100dvh-60px)] lg:h-[calc(100vh-72px)] bg-white lg:rounded-xl border-t lg:border border-slate-200 shadow-sm overflow-hidden text-slate-900 w-full max-w-[100vw]"
        style={{ padding: "32px" }}
      >
        <div className="flex flex-1 overflow-hidden relative w-full h-full max-w-full">
          {/* 1. LEFT SIDEBAR */}
          <div
            className={`${selectedTicket ? "hidden md:flex" : "flex"} w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col flex-shrink-0 z-20`}
          >
            <div className="p-4 md:p-5 border-b border-slate-900 bg-slate-800 text-white shadow-sm z-10 flex-shrink-0">
              <h1 className="font-black text-lg md:text-xl tracking-tight">
                Admin Support
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                Manage Tickets
              </p>
            </div>

            <div className="flex bg-slate-200/50 border-b border-slate-200 p-2 gap-2 shadow-inner flex-shrink-0">
              <button
                onClick={() => {
                  setActiveTab("active");
                  setSelectedTicket(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "active" ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setActiveTab("archived");
                  setSelectedTicket(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === "archived" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >
                Archive
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 smooth-scroll">
              {displayedTickets.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center opacity-60">
                  <span className="text-sm font-semibold text-slate-500">
                    No tickets to manage
                  </span>
                </div>
              ) : (
                displayedTickets.map((ticket) => {
                  const showReminder =
                    ticket.reminder_flag === 1 &&
                    ticket.status !== "In Progress";
                  const showUnread = ticket.unreadCount > 0;
                  const showBadge =
                    (showReminder || showUnread) && activeTab === "active";

                  return (
                    <div
                      key={ticket.globalId}
                      onClick={() => selectTicket(ticket)}
                      className={`custom-ticket-item group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-visible ${
                        selectedTicket?.globalId === ticket.globalId
                          ? "bg-white border-indigo-400 shadow-md ring-1 ring-indigo-500/20"
                          : "bg-white border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      {/* 🟢 TOOLTIP TRIGGERED BY ENTIRE CARD HOVER */}
                      {showBadge && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[999] animate-popOut pointer-events-none">
                          <div className="bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap font-bold border border-slate-700">
                            {showUnread
                              ? `${ticket.unreadCount} New Messages`
                              : "Urgent Reminder"}
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                        </div>
                      )}

                      {showBadge && (
                        <div
                          className={`absolute -top-2 -right-1 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white z-20 shadow-md cursor-help ${
                            showReminder && !showUnread
                              ? "bg-[#ef4444] animate-highlight"
                              : "bg-[#6366f1]"
                          }`}
                          style={{ border: "2px solid white" }}
                        >
                          {showUnread ? ticket.unreadCount : "!"}
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center flex-1 min-w-0 mr-2">
                          <span className="text-[10px] font-black text-slate-400 mr-1.5 flex-shrink-0">
                            #{ticket.id}
                          </span>
                          <h3
                            className={`text-sm font-bold truncate ${selectedTicket?.globalId === ticket.globalId ? "text-indigo-700" : "text-slate-800"}`}
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
                              className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"
                              style={{ animationDelay: "-0.3s" }}
                            ></span>
                            <span
                              className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"
                              style={{ animationDelay: "-0.15s" }}
                            ></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                          </span>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter truncate">
                            {ticket.user} is typing...
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1 text-slate-500 font-medium truncate">
                            <span className="truncate">{ticket.user}</span>
                          </div>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0 ml-2">
                            {ticket.department}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. MAIN CHAT AREA */}
          <div
            className={`${!selectedTicket ? "hidden md:flex" : "flex"} flex-1 flex-col bg-white h-full relative z-10 overflow-hidden w-full max-w-full`}
          >
            {selectedTicket ? (
              <>
                <div className="h-14 border-b border-slate-200 shadow-sm flex justify-between items-center bg-white z-10 px-3 md:px-4 flex-shrink-0 w-full">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="md:hidden p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full flex-shrink-0 transition-colors"
                    >
                      <X size={22} />
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center text-xs md:text-sm border border-slate-200 flex-shrink-0">
                      {selectedTicket.user.charAt(0).toUpperCase()}
                    </div>
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
                        Ticket #{selectedTicket.id} • {selectedTicket.user}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="xl:hidden p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full flex-shrink-0 ml-2 transition-colors"
                  >
                    <Info size={22} />
                  </button>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 flex flex-col-reverse smooth-scroll w-full gap-4"
                >
                  {[...chatHistory].reverse().map((msg) => {
                    if (msg.sender === "System") {
                      let displayMessage = msg.message;
                      let isReminder = false;
                      if (displayMessage.startsWith("SYS_REMINDER|")) {
                        isReminder = true;
                        const reminderUser = displayMessage.split("|")[1];
                        displayMessage = `⚠️ URGENT: The user (${reminderUser}) has sent a reminder that this ticket is not yet done.`;
                      }
                      return (
                        <div
                          key={msg.id}
                          className="flex justify-center my-4 w-full"
                        >
                          <span
                            className={`text-[9px] px-4 py-2 rounded-full font-bold uppercase tracking-wider shadow-sm border text-center max-w-[90%] leading-relaxed ${isReminder ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                          >
                            {displayMessage}
                          </span>
                        </div>
                      );
                    }

                    const isMe = msg.sender === "Support Admin";
                    const isDeleted = msg.message === "[DELETED]";
                    const { type: attachType, src: attachSrc } =
                      parseAttachment(msg.attachment);

                    return (
                      <div
                        key={msg.id}
                        className={`flex group items-center ${isMe ? "justify-end gap-2" : "justify-start gap-2"} w-full mt-4`}
                      >
                        {/* 🟢 CENTERED DELETE ICON */}
                        {isMe &&
                          selectedTicket.status !== "Finished" &&
                          !isDeleted && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                              title="Delete message"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                        <div
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] md:max-w-md`}
                        >
                          {!isMe && (
                            <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">
                              {msg.sender}
                            </span>
                          )}

                          {/* 🟢 DELETED MESSAGE TOMBSTONE */}
                          {isDeleted ? (
                            <div
                              className={`p-2.5 px-4 rounded-2xl shadow-sm text-[11px] italic flex items-center gap-1.5 ${isMe ? "bg-slate-100 text-slate-500 border border-slate-200 rounded-tr-none" : "bg-slate-100 text-slate-500 border border-slate-200 rounded-tl-none"}`}
                            >
                              <Ban size={12} className="opacity-70" />{" "}
                              {isMe ? "You" : msg.sender} deleted a message
                            </div>
                          ) : (
                            <div
                              className={`p-3 rounded-2xl shadow-sm relative leading-relaxed ${isMe ? "bg-slate-800 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}`}
                            >
                              {attachType === "image" && attachSrc && (
                                <img
                                  src={attachSrc}
                                  alt="Attachment"
                                  className="max-h-[160px] sm:max-h-[200px] w-auto rounded-lg mb-1.5 cursor-pointer border border-black/10 active:opacity-50 object-contain bg-black/5"
                                  onClick={() => setFullScreenImage(attachSrc)}
                                />
                              )}
                              {attachType === "video" && attachSrc && (
                                <video
                                  src={attachSrc}
                                  controls
                                  className="max-h-[200px] w-auto rounded-lg mb-1.5 border border-black/10 bg-black"
                                />
                              )}
                              {attachType === "audio" && attachSrc && (
                                <CustomAudioPlayer
                                  src={attachSrc}
                                  isMe={isMe}
                                />
                              )}

                              {msg.message && (
                                <p className="custom-message-text text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isOpponentTyping && (
                    <div className="flex justify-start items-end gap-2 mt-2 animate-fadeIn w-full">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center text-[10px] border border-slate-200 flex-shrink-0 shadow-sm">
                        {selectedTicket.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1 w-fit">
                          <span
                            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                          {selectedTicket.user} is typing...
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-2 md:p-3 border-t border-slate-200 bg-white flex-shrink-0 z-50 w-full box-border">
                  {selectedTicket.status === "Finished" ? (
                    <div className="w-full bg-slate-100 text-slate-400 text-xs font-bold text-center py-3 rounded-xl border border-slate-200 uppercase tracking-widest select-none">
                      Ticket is closed.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      {/* PREVIEW SECTION */}
                      {filePreview && (
                        <div className="relative self-start mb-1 animate-fadeIn">
                          {fileType === "image" && (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm"
                            />
                          )}
                          {fileType === "video" && (
                            <video
                              src={filePreview}
                              className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm"
                              muted
                            />
                          )}
                          {fileType === "audio" && (
                            <div className="h-10 px-4 bg-slate-100 rounded-full flex items-center border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                              🎵 Audio Ready
                            </div>
                          )}

                          <button
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-900 transition shadow-md"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      <div className="custom-input-pill flex items-center bg-slate-100 p-1 sm:p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all relative w-full shadow-sm box-border">
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
                              Photo
                            </button>
                            <button
                              onClick={() => {
                                videoInputRef.current?.click();
                                setIsAttachmentMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                            >
                              <Video size={16} className="text-purple-500" />{" "}
                              Video
                            </button>
                            <button
                              onClick={() => {
                                cameraInputRef.current?.click();
                                setIsAttachmentMenuOpen(false);
                              }}
                              className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                            >
                              <Camera size={16} className="text-emerald-500" />{" "}
                              Camera
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() =>
                            setIsAttachmentMenuOpen(!isAttachmentMenuOpen)
                          }
                          className={`p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-indigo-200 text-indigo-800" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
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
                          accept="video/*"
                          className="hidden"
                          ref={videoInputRef}
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

                        {/* 🟢 INPUT OR RECORDING STATUS */}
                        {isRecording ? (
                          <div className="flex-1 flex items-center px-4 bg-slate-200/50 rounded-xl h-[42px] sm:h-[46px] animate-pulse mx-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-xs font-bold text-red-500">
                              Recording {formatTime(recordingTime)}
                            </span>
                          </div>
                        ) : (
                          <input
                            value={messageInput}
                            onChange={handleTyping}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            disabled={isSending}
                            placeholder="Type reply..."
                            className="custom-input-text flex-1 w-full min-w-0 bg-transparent px-2 py-2 text-[13px] md:text-sm focus:outline-none relative z-10 text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        )}

                        {/* 🟢 MIC / SEND BUTTON LOGIC */}
                        {!messageInput.trim() && !filePreview ? (
                          <button
                            onClick={
                              isRecording ? stopRecording : startRecording
                            }
                            disabled={isSending}
                            className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 ${isRecording ? "bg-red-500 text-white shadow-md animate-pulse" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                            title={
                              isRecording
                                ? "Stop recording"
                                : "Record voice message"
                            }
                          >
                            {isRecording ? (
                              <Square size={14} fill="currentColor" />
                            ) : (
                              <Mic size={16} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={handleSend}
                            disabled={isSending}
                            className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 bg-indigo-600 text-white shadow-md active:scale-95 disabled:opacity-50`}
                            title="Send message"
                          >
                            <Send
                              size={14}
                              className="custom-send-icon ml-0.5"
                            />
                          </button>
                        )}
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
              {/* 🟢 FIXED: Changed 'absolute' to 'fixed' and 'inset-y-0' to 'top-0 bottom-0' */}
              <div
                className={`fixed right-0 top-0 bottom-0 w-[200px] bg-white z-[60] transition-transform duration-300 ease-in-out shadow-2xl ${
                  isInfoOpen ? "translate-x-0" : "translate-x-full"
                } xl:static xl:translate-x-0 xl:flex xl:flex-col xl:w-72 xl:border-l xl:border-slate-200 xl:bg-white xl:shadow-none`}
              >
                <div className="p-5 h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 xl:hidden">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Information
                    </h3>
                    <button
                      onClick={() => setIsInfoOpen(false)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
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
                    {/* ... the rest of the ticket info (ID, Category, Date) remains the same ... */}
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
          className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
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

        /* 🟢 CRITICAL: ALlows tooltips to break out of sidebar */
        .smooth-scroll {
          overflow-y: auto;
          overflow-x: visible !important; 
          position: relative;
        }

        @keyframes popOut {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popOut {
          animation: popOut 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 📱 Extremely Small Phones */
        @media (max-width: 360px) { 
          .custom-input-pill { padding: 4px !important; gap: 2px !important; }
          .custom-input-text { font-size: 11px !important; padding-left: 4px !important; padding-right: 4px !important; }
          .custom-send-btn { width: 28px !important; height: 28px !important; }
          .custom-send-icon { width: 12px !important; height: 12px !important; margin-left: 0 !important; }
          .custom-message-text { font-size: 12px !important; }
          .custom-header-title { font-size: 12px !important; }
          .custom-ticket-item { padding: 8px !important; }
        }
        @media (max-width: 390px) { 
          .custom-input-pill { padding: 6px !important; }
          .custom-input-text { font-size: 12px !important; }
          .custom-message-text { font-size: 13px !important; }
        }
      `}</style>
    </>
  );
}
