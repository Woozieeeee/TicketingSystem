"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";

// Components
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import TicketDetails from "./components/TicketDetails";
import { GlobalStyles, formatStatus } from "./components/CustomStyles";

interface Ticket {
  globalId: string;
  id: string;
  title: string;
  status: string;
  preview: string;
  category: string;
  createdBy: string;
  dept: string;
  date: string;
  updatedAt: string;
  reminder_flag: number;
  unreadCount: number;
  isTyping: boolean;
}

interface Message {
  id: number;
  ticketId: string;
  sender: string;
  message: string;
  attachment: string | null;
  created_at: string;
}

export default function UserChatPage() {
  // --- STATES ---
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // --- REFS ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);

  // --- HELPERS ---
  const parseAttachment = (attachment: any) => {
    if (!attachment) return { type: "", src: "" };

    const lowerSrc = attachment.toLowerCase();

    if (attachment.includes("image"))
      return { type: "image", src: attachment };
    if (attachment.includes("video"))
      return { type: "video", src: attachment };
    if (attachment.includes("audio"))
      return { type: "audio", src: attachment };
    if (
      lowerSrc.includes("pdf") || 
      lowerSrc.includes("doc") || 
      lowerSrc.includes("xls") || 
      lowerSrc.includes("txt") || 
      lowerSrc.includes("csv")
    ) {
      const decodedSrc = decodeURIComponent(attachment);
      const fileNameExtract = decodedSrc.substring(decodedSrc.lastIndexOf("/") + 1);
      return { type: "document", src: attachment, name: fileNameExtract || "Download Document" };
    }

    return { type: "", src: "" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Finished":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // --- FUNCTIONS ---
  const fetchTickets = useCallback(async (currentUser: any) => {
    if (!currentUser?.username) return;
    try {
      // Backend now uses authenticated user info from cookies, no query params needed
      const res = await fetch(
        `${API_URL}/api/tickets`,
        { headers: getAuthHeaders(), credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        const formattedTickets = data.map((t: any) => ({
          ...t,
          globalId: t.id,
          status: formatStatus(t.status),
          preview: t.description || "No description...",
          category: t.category || "General",
          createdBy: t.createdBy,
          dept: t.dept,
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
          if (updatedTicket && updatedTicket.status !== prev.status)
            return { ...prev, status: updatedTicket.status };
          return prev;
        });
      }
    } catch (error: any) {}
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${ticketId}/messages`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const selectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setChatHistory([]);
    setLastMessageCount(0);
    setIsInfoOpen(false);
    removeFile();

    await fetchMessages(ticket.globalId);

    try {
      const readerName = user?.username || "User";
      await fetch(`${API_URL}/api/chat/${ticket.globalId}/read`, {
        method: "PATCH", 
        headers: { 
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ reader: readerName }),
      });

      setTickets((prev) =>
        prev.map((t) =>
          t.globalId === ticket.globalId ? { ...t, unreadCount: 0 } : t,
        ),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
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
      setSelectedFile(file);
      setFileName(file.name);
      
      const reader = new FileReader();
      if (file.type.startsWith("video/")) {
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
          setFileType("video");
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("image/")) {
        reader.onload = async (event) => {
          const originalBase64 = event.target?.result as string;
          const compressed = await compressImage(originalBase64);
          setFilePreview(compressed);
          setFileType("image");
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
          setFileType("document");
        };
        reader.readAsDataURL(file);
      }
    }
    setIsAttachmentMenuOpen(false);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices)
        return alert("HTTPS required for microphone.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
          setFileType("audio");
          setFileName("VoiceNote.webm");
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000,
      );
    } catch (err) {
      alert("Microphone error.");
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
    setFilePreview(null);
    setFileType(null);
    setSelectedFile(null);
    setFileName(null);
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
        credentials: "include",
        body: JSON.stringify({ username: currentUsername, isTyping: true }),
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: currentUsername, isTyping: false }),
      });
    }, 2500);
  };

  const handleSend = async () => {
    if ((!messageInput.trim() && !filePreview) || !selectedTicket || isSending)
      return;
    setIsSending(true);

    const currentUsername = user?.username || "User";
    let finalAttachment = filePreview;
    if (filePreview && fileType)
      finalAttachment = `[${fileType}]${filePreview}`;

    const payload = {
      sender: currentUsername,
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
        credentials: "include",
        body: JSON.stringify({ username: currentUsername, isTyping: false }),
      });

      await fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/messages`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      fetchMessages(selectedTicket.globalId);
    } catch (error) {
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!messageId) return;
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
          credentials: "include",
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

  // --- USE EFFECTS ---
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
    if (!selectedTicket || !user) return;
    
    fetchMessages(selectedTicket.globalId);

    if (selectedTicket.unreadCount > 0) {
      const readerName = user?.username || "User";
      
      fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/read`, {
        method: "PATCH",
        headers: { 
          ...getAuthHeaders(),
          "Content-Type": "application/json" 
        },
        credentials: "include",
        body: JSON.stringify({ reader: readerName }),
      });

      setTickets((prev) =>
        prev.map((t) =>
          t.globalId === selectedTicket.globalId ? { ...t, unreadCount: 0 } : t
        )
      );
    }

    const messageInterval = setInterval(
      () => fetchMessages(selectedTicket.globalId),
      3000,
    );
    return () => clearInterval(messageInterval);
  }, [selectedTicket?.globalId, fetchMessages, user]);

  useEffect(() => {
    if (!selectedTicket || !user) return;
    const checkTypingStatus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/chat/${selectedTicket.globalId}/typing?currentUser=${user.username}`,
          { credentials: "include" }
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
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setLastMessageCount(chatHistory.length);
    }
  }, [chatHistory, lastMessageCount]);

  // --- RENDER ---
  return (
    <>
      {/* 🟢 WALANG GAP O MARGIN PROPERTIES DITO PARA MAIWASAN ANG LAYOUT MISALIGNMENT AT SPACING BUGS */}
      <div className="flex h-screen w-full bg-white overflow-hidden text-slate-900">
        
        {/* LEFT SIDEBAR - ChatList */}
        <ChatList
          tickets={tickets}
          selectedTicket={selectedTicket}
          activeTab={activeTab}
          onSelectTicket={selectTicket}
          onSetActiveTab={setActiveTab}
        />

        {/* CENTER - ChatWindow */}
        <ChatWindow
          selectedTicket={selectedTicket}
          chatHistory={chatHistory}
          user={user}
          currentUser={user}
          messageInput={messageInput}
          isSending={isSending}
          isRecording={isRecording}
          recordingTime={recordingTime}
          filePreview={filePreview}
          fileType={fileType}
          isAttachmentMenuOpen={isAttachmentMenuOpen}
          isOpponentTyping={isOpponentTyping}
          parseAttachment={parseAttachment}
          getStatusColor={getStatusColor}
          onBack={() => setSelectedTicket(null)}
          onOpenInfo={() => setIsInfoOpen(true)}
          onSend={handleSend}
          onTyping={handleTyping}
          onDeleteMessage={deleteMessage}
          onToggleAttachmentMenu={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
          onCloseAttachmentMenu={() => setIsAttachmentMenuOpen(false)}
          onRemoveFile={removeFile}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileSelect={handleFileSelect}
          galleryInputRef={galleryInputRef}
          cameraInputRef={cameraInputRef}
          videoInputRef={videoInputRef}
          documentInputRef={documentInputRef}
          chatContainerRef={chatContainerRef}
          onSetFullScreenImage={setFullScreenImage}
        />

        {/* RIGHT SIDEBAR - TicketDetails */}
        <TicketDetails
          selectedTicket={selectedTicket}
          isInfoOpen={isInfoOpen}
          onCloseInfo={() => setIsInfoOpen(false)}
          
        />  
      </div>

      {/* FULL SCREEN IMAGE MODAL */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
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

      {/* GLOBAL STYLES */}
      <GlobalStyles />
    </>
  );
}