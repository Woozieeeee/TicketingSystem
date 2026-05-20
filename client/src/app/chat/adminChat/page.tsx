"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ChatList, { Ticket } from "../adminChat/components/ChatList";
import ChatWindow from "../adminChat/components/ChatWindow";
import TicketDetails from "../adminChat/components/TicketDetails";

// NOTE: You already have this in your original file
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";

export default function Page() {
  // ---------------- STATE ----------------
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Naka-sync sa file uploads

  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null); // Naka-sync sa file selection

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [isOpponentTyping, setIsOpponentTyping] = useState(false);

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // ---------------- REFS ----------------
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null); // Naka-sync para sa document selections

  // ---------------- HELPERS ----------------
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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const handleSend = async () => {
    if (!messageInput.trim() && !selectedFile || !selectedTicket || isSending) return;
    setIsSending(true);

    const currentUsername = user?.username || "Admin";
    const payload = {
      sender: currentUsername,
      message: messageInput.trim(),
      attachment: null,
    };

    const optimisticMsg = {
      id: Date.now(),
      ticketId: selectedTicket.globalId,
      sender: payload.sender,
      message: payload.message,
      attachment: null,
      created_at: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, optimisticMsg]);
    setMessageInput("");
    removeFile();

    try {
      await fetch(`${API_URL}/api/chat/${selectedTicket.globalId}/messages`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      fetchMessages(selectedTicket.globalId);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = (id: number) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, message: "[DELETED]" } : msg
      )
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setFilePreview(url);

    if (file.type.startsWith("image")) setFileType("image");
    else if (file.type.startsWith("video")) setFileType("video");
    else if (file.type.startsWith("audio")) setFileType("audio");
    else setFileType("document");
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
    setSelectedFile(null);
    setFileName(null);
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const CustomAudioPlayer = ({ src }: any) => (
    <audio controls src={src} />
  );

  // ---------------- SELECT TICKET & MARK AS READ ----------------
  const markAsRead = async (ticketId: string) => {
    try {
      await fetch(`${API_URL}/api/chat/${ticketId}/read`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reader: user?.username || "Admin" }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const selectTicket = async (ticket: Ticket) => {
    if (ticket.unreadCount > 0) {
      await markAsRead(ticket.globalId);
      setTickets((prev) =>
        prev.map((t) =>
          t.globalId === ticket.globalId ? { ...t, unreadCount: 0 } : t
        )
      );
    }
    setSelectedTicket(ticket);
  };

  // ---------------- ACCEPT TICKET FUNCTION ----------------
  const handleAcceptTicket = async (ticket: any) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.globalId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.globalId === ticket.globalId ? { ...t, status: "In Progress" } : t
          )
        );
        setSelectedTicket({ ...ticket, status: "In Progress" });
      }
    } catch (error) {
      console.error("Error accepting ticket:", error);
    }
  };

  // ---------------- FETCH FUNCTIONS ----------------
  const fetchTickets = useCallback(async (userData: any) => {
    try {
      const params = new URLSearchParams();
      if (userData?.role) params.set("role", userData.role);
      if (userData?.dept) params.set("dept", userData.dept);
      if (userData?.username) params.set("username", userData.username);

      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const transformed = data.map((t: any) => ({
            ...t,
            globalId: t.id,
            activityDate: t.last_reminded_at || t.updatedAt || t.createdAt || t.date,
            status:
              t.status === "PENDING" ? "Pending" :
              t.status === "IN_PROGRESS" ? "In Progress" :
              t.status === "RESOLVED" ? "Resolved" :
              t.status === "FINISHED" ? "Finished" : t.status,
            unreadCount: t.unreadCount || 0,
          }));
          setTickets(transformed);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  // Auto-fetch tickets on mount with polling
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

  // Auto-fetch messages when ticket selected with polling
  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.globalId);
    
    if (selectedTicket.unreadCount > 0) {
      markAsRead(selectedTicket.globalId);
    }

    const messageInterval = setInterval(() => fetchMessages(selectedTicket.globalId), 3000);
    return () => clearInterval(messageInterval);
  }, [selectedTicket, fetchMessages]);

  return (
    <>
      {/* 🟢 TANGGAL ANG LAHAT NG GAP PROPERTIES DITO SA WRAPPER PARA DI MASIRA ANG SIDEBARS */}
      <div className="flex h-screen w-full overflow-hidden bg-white">
        {/* LEFT SIDEBAR */}
        <ChatList
          tickets={tickets}
          selectedTicket={selectedTicket}
          onSelectTicket={selectTicket}
          onAcceptTicket={handleAcceptTicket}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedTicket={setSelectedTicket}
        />

        {/* MAIN CHAT AREA */}
        {selectedTicket?.status === "Pending" ? (
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center bg-slate-50 h-full border-r border-slate-200">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Ticket Pending
              </h3>
              <p className="text-slate-500 mb-4 max-w-sm text-sm">
                This ticket needs to be accepted before starting the conversation.
              </p>
              <button
                onClick={() => handleAcceptTicket(selectedTicket)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept & Start Chat
              </button>
            </div>
          </div>
        ) : (
          <ChatWindow
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            currentUser={user}
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
            documentInputRef={documentInputRef} // Ipinasa ang ref nang maayos
            handleFileSelect={handleFileSelect}
            isRecording={isRecording}
            recordingTime={recordingTime}
            startRecording={startRecording}
            stopRecording={stopRecording}
            formatTime={formatTime}
            CustomAudioPlayer={CustomAudioPlayer}
          />
        )}

        {/* RIGHT SIDEBAR */}
        <TicketDetails
          selectedTicket={selectedTicket}
          isInfoOpen={isInfoOpen}
          setIsInfoOpen={setIsInfoOpen}
          getStatusColor={getStatusColor}
        />
      </div>

      {/* FULLSCREEN IMAGE */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center"
          onClick={() => setFullScreenImage(null)}
        >
          <img
            src={fullScreenImage}
            className="max-w-full max-h-[90vh] object-contain"
            alt="Fullscreen preview"
          />
        </div>
      )}
    </>
  );
}