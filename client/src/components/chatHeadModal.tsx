"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import Swal from "sweetalert2";
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
            ? "bg-white text-green-700"
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

export default function ChatHeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [input, setInput] = useState("");

  const constraintsRef = useRef(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "audio" | null>(
    null,
  );
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [messages, isOpen]);

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

  const sendMessage = async () => {
    if ((!input.trim() && !filePreview) || !activeTicket || !user || isSending)
      return;

    setIsSending(true);
    const messageText = input;

    let finalAttachment = filePreview;
    if (filePreview && fileType) {
      finalAttachment = `[${fileType}]${filePreview}`;
    }

    setInput("");
    removeFile();

    const optimisticMessage: Message = {
      id: Date.now(),
      ticketId: activeTicket.globalId as number,
      sender: user.username,
      message: messageText,
      attachment: finalAttachment,
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
            attachment: finalAttachment,
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

  // 🟢 NEW: Delete Message
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
          setMessages((prev) =>
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

  if (!user) return null;

  return (
    <>
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
                                  removeFile();
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

                  <div
                    ref={chatContainerRef}
                    className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50/50 z-10 relative flex flex-col-reverse gap-4"
                  >
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
                            className="flex justify-center my-2 w-full"
                          >
                            <span className="bg-white text-gray-500 text-[10px] sm:text-[11px] px-4 py-1.5 rounded-full font-medium border border-gray-200 shadow-sm text-center max-w-[90%]">
                              {displayMessage}
                            </span>
                          </div>
                        );
                      }

                      const isMe =
                        user.role === "Head"
                          ? msg.sender !== activeTicket?.user
                          : msg.sender === user.username;
                      const isDeleted = msg.message === "[DELETED]";
                      const { type: attachType, src: attachSrc } =
                        parseAttachment(msg.attachment);

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-center group gap-2 ${isMe ? "justify-end" : "justify-start"} w-full`}
                        >
                          {/* 🟢 CENTERED DELETE ICON */}
                          {isMe &&
                            activeTicket?.status !== "Finished" &&
                            !isDeleted && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                                title="Delete message"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                          <div
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[80%]`}
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
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 5 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className={`p-3 sm:p-3.5 rounded-2xl text-[13px] sm:text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                                  isMe
                                    ? "bg-green-700 text-white rounded-tr-none"
                                    : "bg-white text-gray-700 rounded-tl-none border border-gray-100"
                                }`}
                              >
                                {attachType === "image" && attachSrc && (
                                  <img
                                    src={attachSrc}
                                    alt="Attachment"
                                    className="max-h-[140px] sm:max-h-[180px] w-auto object-contain rounded-lg mb-2 bg-black/5 cursor-pointer"
                                    onClick={() =>
                                      setFullScreenImage(attachSrc)
                                    }
                                  />
                                )}
                                {attachType === "video" && attachSrc && (
                                  <video
                                    src={attachSrc}
                                    controls
                                    className="max-h-[180px] w-auto rounded-lg mb-2 border border-black/10 bg-black"
                                  />
                                )}
                                {attachType === "audio" && attachSrc && (
                                  <CustomAudioPlayer
                                    src={attachSrc}
                                    isMe={isMe}
                                  />
                                )}

                                {msg.message}
                              </motion.div>
                            )}

                            <span className="text-[9px] text-gray-400 mt-1 mx-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {activeTicket && messages.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center flex-col mt-10">
                        <p className="text-center text-xs text-gray-400">
                          No messages yet. Say hello!
                        </p>
                      </div>
                    )}

                    {activeTicket && (
                      <div className="text-center py-2 sticky top-0 z-10 w-full mb-auto mt-2">
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1 rounded-full shadow-sm uppercase tracking-tighter inline-block">
                          Chat ID: {activeTicket.globalId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex flex-col gap-2 z-20">
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

                    <div className="flex gap-2 items-center w-full relative">
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
                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-green-200 text-green-800" : "bg-slate-100 text-slate-500 hover:text-green-600 hover:bg-green-50"}`}
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

                      {isRecording ? (
                        <div className="flex-1 flex items-center px-4 bg-slate-100 rounded-xl h-[42px] sm:h-[46px] animate-pulse">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-xs font-bold text-red-500">
                            Recording {formatTime(recordingTime)}
                          </span>
                        </div>
                      ) : (
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          disabled={!activeTicket || isSending}
                          placeholder={
                            activeTicket
                              ? "Message..."
                              : "Select a ticket first"
                          }
                          className="flex-1 h-[42px] sm:h-[46px] text-[16px] sm:text-sm focus:outline-none text-gray-700 bg-gray-100 px-3 rounded-xl border border-transparent focus:border-green-400 transition-all min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      )}

                      {!input.trim() && !filePreview ? (
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={!activeTicket || isSending}
                          className={`flex-shrink-0 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl flex items-center justify-center transition-all shadow-sm ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-green-600 text-white hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100"}`}
                          title={
                            isRecording
                              ? "Stop recording"
                              : "Record voice message"
                          }
                        >
                          {isRecording ? (
                            <Square size={16} fill="currentColor" />
                          ) : (
                            <Mic size={18} />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={sendMessage}
                          disabled={
                            (!input.trim() && !filePreview) || isSending
                          }
                          className="flex-shrink-0 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 transition-all active:scale-95 shadow-md shadow-green-200/50 disabled:opacity-50 disabled:active:scale-100"
                        >
                          <Send size={18} className="ml-0.5" />
                        </button>
                      )}
                    </div>
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

        {fullScreenImage && (
          <div
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn pointer-events-auto"
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
      </div>
    </>
  );
}
