"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../../config/api";
import { getAuthHeaders } from "../../lib/apiClient";

const formatStatus = (raw: string) => {
  if (!raw) return "Pending";
  const s = raw.toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "IN_PROGRESS" || s === "IN PROGRESS") return "In Progress";
  if (s === "RESOLVED" || s === "FINISHED") return "Finished";
  return raw;
};

export const useChatLogic = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const constraintsRef = useRef(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    if (!user?.username) return;
    try {
      const params = new URLSearchParams();
      if (user.role === "Head" && user.dept) {
        params.set("role", "Head");
        params.set("dept", user.dept);
      } else if (user.role === "User") {
        params.set("role", "User");
        params.set("username", user.username);
      }
      const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((t: any, i: number) => ({
          globalId: t.id,
          displayId: `#${i + 1}`,
          title: t.title || "No Title",
          user: t.createdBy || "Unknown",
          status: formatStatus(t.status),
          lastMessage: t.description || "",
        }));
        setTickets(formatted);
      }
    } catch (error) {
      console.error("ChatHead: Failed to fetch tickets:", error);
    }
  }, [user]);

  // Fetch messages for active ticket
  const fetchMessages = useCallback(async () => {
    if (!activeTicket?.globalId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/chat/${activeTicket.globalId}/messages`,
        { credentials: "include" },
      );
      if (res.ok) setMessages(await res.json());
    } catch (error) {
      console.error("ChatHead: Failed to fetch messages:", error);
    }
  }, [activeTicket]);

  // Poll tickets when user is loaded
  useEffect(() => {
    if (!user) return;
    fetchTickets();
    const interval = setInterval(fetchTickets, 8000);
    return () => clearInterval(interval);
  }, [user, fetchTickets]);

  // Poll messages when a ticket is active
  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTicket, fetchMessages]);

  // Mark as read when selecting a ticket
  useEffect(() => {
    if (!activeTicket?.globalId || !user?.username) return;
    fetch(`${API_URL}/api/chat/${activeTicket.globalId}/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reader: user.username }),
    }).catch(() => {});
  }, [activeTicket, user]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

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

  const sendMessage = async () => {
    if ((!input.trim() && !filePreview) || !activeTicket?.globalId) return;

    const currentUsername = user?.username || "User";
    let finalAttachment = filePreview;
    if (filePreview && fileType)
      finalAttachment = `[${fileType}]${filePreview}`;

    const payload = {
      sender: currentUsername,
      message: input.trim(),
      attachment: finalAttachment,
    };

    const optimisticMsg = {
      id: Date.now(),
      ticketId: activeTicket.globalId,
      sender: payload.sender,
      message: payload.message,
      attachment: payload.attachment,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setFilePreview(null);
    setFileType(null);
    setIsAttachmentMenuOpen(false);
    setIsSending(true);

    try {
      await fetch(
        `${API_URL}/api/chat/${activeTicket.globalId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      fetchMessages();
    } catch (error) {
      console.error("ChatHead: Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (id: any) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id
              ? { ...msg, message: "[DELETED]", attachment: null }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("ChatHead: Failed to delete message:", error);
    }
  };

  const parseAttachment = (attachmentStr: string | null | undefined) => {
    if (!attachmentStr) return { type: null, src: null };
    const match = attachmentStr.match(/^\[(.*?)\](.*)$/);
    return match
      ? { type: match[1], src: match[2] }
      : { type: null, src: attachmentStr };
  };

  return {
    isOpen,
    setIsOpen,
    showTicketList,
    setShowTicketList,
    fullScreenImage,
    setFullScreenImage,
    input,
    setInput,
    isSending,

    filePreview,
    setFilePreview,
    fileType,
    setFileType,
    isAttachmentMenuOpen,
    setIsAttachmentMenuOpen,

    isRecording,
    setIsRecording,
    recordingTime,
    startRecording,
    stopRecording,

    user,
    tickets,
    activeTicket,
    setActiveTicket,
    messages,

    sendMessage,
    deleteMessage,
    parseAttachment,

    constraintsRef,
    chatContainerRef,
  };
};
