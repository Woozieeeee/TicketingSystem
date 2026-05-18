"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import TicketDetails from "./components/TicketDetails";
import { API_URL } from "../../../config/api";
import { getAuthHeaders, getUser } from "../../../lib/apiClient";

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

interface Message {
  id: number;
  ticketId: string;
  sender: string;
  message: string;
  attachment: string | null;
  created_at: string;
}

const formatStatus = (raw: string) => {
  if (!raw) return "Pending";
  const s = raw.toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "IN_PROGRESS" || s === "IN PROGRESS") return "In Progress";
  if (s === "RESOLVED" || s === "FINISHED") return "Finished";
  return raw;
};

export default function AdminChatPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);

  const fetchTickets = useCallback(async (currentUser: any) => {
    if (!currentUser?.username) return;
    try {
      const params = new URLSearchParams();
      if (currentUser.role === "Head" && currentUser.dept) {
        params.set("role", "Head");
        params.set("dept", currentUser.dept);
      }
      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const formatted: Ticket[] = data.map((t: any, i: number) => ({
          globalId: t.id,
          id: i + 1,
          title: t.title || "No Title",
          user: t.createdBy || "Unknown",
          status: formatStatus(t.status),
          department: t.dept || "",
          category: t.category || "General",
          date: new Date(t.createdAt || t.date).toLocaleDateString(),
          preview: t.description || "No description...",
          updatedAt: t.updatedAt || t.createdAt || t.date,
          reminder_flag: t.reminder_flag || 0,
          unreadCount: t.unreadCount || 0,
          isTyping: false,
        }));
        setTickets(formatted);

        setSelectedTicket((prev) => {
          if (!prev) return prev;
          const updated = formatted.find((t) => t.globalId === prev.globalId);
          if (updated && updated.status !== prev.status)
            return { ...prev, status: updated.status };
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${ticketId}/messages`, {
        credentials: "include",
      });
      if (res.ok) setChatHistory(await res.json());
    } catch (error) {
      console.error("Failed to fetch messages:", error);
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
      const readerName = user?.username || "Admin";
      await fetch(`${API_URL}/api/chat/${ticket.globalId}/read`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const parseAttachment = (attachment: any) => {
    if (!attachment) return { type: "", src: "" };
    const match = attachment.match(/^\[(.*?)\](.*)$/);
    if (match) return { type: match[1], src: match[2] };
    if (attachment.includes("image")) return { type: "image", src: attachment };
    if (attachment.includes("video")) return { type: "video", src: attachment };
    if (attachment.includes("audio")) return { type: "audio", src: attachment };
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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!selectedTicket || selectedTicket.status === "Finished") return;
    const now = Date.now();
    const currentUsername = user?.username || "Admin";

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

    const currentUsername = user?.username || "Admin";
    let finalAttachment = filePreview;
    if (filePreview && fileType)
      finalAttachment = `[${fileType}]${filePreview}`;

    const payload = {
      sender: currentUsername,
      message: messageInput.trim(),
      attachment: finalAttachment,
    };

    const optimisticMsg: Message = {
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      fetchMessages(selectedTicket.globalId);
    } catch (error) {
      console.error("Failed to send message:", error);
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
        console.error("Delete failed:", error);
      }
    }
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
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const CustomAudioPlayer = ({ src }: { src: string; isMe?: boolean }) => (
    <audio controls src={src} className="max-w-[240px]" />
  );

  // Load user and start polling
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
        fetchTickets(userData);
        const ticketInterval = setInterval(() => fetchTickets(userData), 5000);
        return () => clearInterval(ticketInterval);
      }
    };

    loadUser();
  }, [fetchTickets]);

  // Poll messages for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.globalId);
    const messageInterval = setInterval(
      () => fetchMessages(selectedTicket.globalId),
      3000,
    );
    return () => clearInterval(messageInterval);
  }, [selectedTicket, fetchMessages]);

  // Poll typing indicator
  useEffect(() => {
    if (!selectedTicket || !user) return;
    const checkTypingStatus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/chat/${selectedTicket.globalId}/typing?currentUser=${user.username}`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          setIsOpponentTyping(data.isTyping);
          setTickets((current) =>
            current.map((t) =>
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatHistory.length > lastMessageCount) {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setLastMessageCount(chatHistory.length);
    }
  }, [chatHistory, lastMessageCount]);

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
        <ChatList
          tickets={tickets}
          selectedTicket={selectedTicket}
          onSelectTicket={selectTicket}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedTicket={setSelectedTicket}
        />

        <ChatWindow
          selectedTicket={selectedTicket}
          setSelectedTicket={setSelectedTicket}
          setIsInfoOpen={setIsInfoOpen}
          chatContainerRef={chatContainerRef}
          chatHistory={chatHistory}
          parseAttachment={parseAttachment}
          getStatusColor={getStatusColor}
          deleteMessage={deleteMessage}
          setFullScreenImage={setFullScreenImage}
          isOpponentTyping={isOpponentTyping}
          messageInput={messageInput}
          handleTyping={handleTyping}
          handleSend={handleSend}
          isSending={isSending}
          filePreview={filePreview}
          fileType={fileType}
          removeFile={removeFile}
          isAttachmentMenuOpen={isAttachmentMenuOpen}
          setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
          galleryInputRef={galleryInputRef}
          videoInputRef={videoInputRef}
          cameraInputRef={cameraInputRef}
          handleFileSelect={handleFileSelect}
          isRecording={isRecording}
          recordingTime={recordingTime}
          startRecording={startRecording}
          stopRecording={stopRecording}
          formatTime={formatTime}
          CustomAudioPlayer={CustomAudioPlayer}
          currentUsername={user?.username}
        />

        <TicketDetails
          selectedTicket={selectedTicket}
          isInfoOpen={isInfoOpen}
          setIsInfoOpen={setIsInfoOpen}
          getStatusColor={getStatusColor}
        />
      </div>

      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center"
          onClick={() => setFullScreenImage(null)}
        >
          <img
            src={fullScreenImage}
            className="max-w-full max-h-[90vh]"
            alt="Fullscreen preview"
          />
        </div>
      )}
    </>
  );
}
