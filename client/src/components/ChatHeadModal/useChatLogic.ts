"use client";
import { useState, useEffect, useRef } from "react";
import { authFetch, getStoredUser } from "../../lib/apiClient";

export const useChatLogic = () => {
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Attachment & Menu States
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Data States
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const constraintsRef = useRef(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load user on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Fetch tickets based on user role
  const fetchTickets = async () => {
  if (!user) return;
  try {
    setLoading(true);
    let endpoint;
    
    if (user.role === 'Support Admin' || user.role === 'Admin' || user.role === 'Head') {
      endpoint = `/api/tickets?role=Head&dept=${user.dept}`;
    } else {
      endpoint = `/api/tickets?role=User&username=${user.username}`;
    }

    const response = await authFetch(endpoint);

    if (response.ok) {
      const data = await response.json();
      setTickets(data);
      
      // Calculate total unread count
      const totalUnread = data.reduce((sum: number, ticket: any) => 
        sum + (ticket.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } else {
      console.error("Failed to fetch tickets:", response.status);
    }
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
  } finally {
    setLoading(false);
  }
};

  // Fetch messages for active ticket
  const fetchMessages = async (ticketId: number) => {
    if (!ticketId) return;
    
    try {
      const response = await authFetch(`/api/chat/${ticketId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read
        await authFetch(`/api/chat/${ticketId}/read`, {
          method: 'PUT',
          body: JSON.stringify({ reader: user.username })
        });
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // Auto-fetch tickets when user changes
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Auto-fetch messages when active ticket changes
  useEffect(() => {
    if (activeTicket) {
      fetchMessages(activeTicket.id);
    }
  }, [activeTicket]);

  // Timer logic for recording
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

  // Auto-scroll logic
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Implement actual audio recording
    const audioUrl = ""; 
    setFilePreview(audioUrl); 
    setFileType("audio");
  };

  const sendMessage = async () => {
    if (!input.trim() && !filePreview) return;
    if (!activeTicket || !user) return;

    try {
      setIsSending(true);
      
      const messageData = {
        sender: user.username,
        message: input.trim(),
        attachment: filePreview ? `[${fileType}]${filePreview}` : null,
      };

      const response = await authFetch(`/api/chat/${activeTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        // Refresh messages and tickets
        await fetchMessages(activeTicket.id);
        await fetchTickets();
        
        setInput("");
        setFilePreview(null);
        setFileType(null);
        setIsAttachmentMenuOpen(false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const response = await authFetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchMessages(activeTicket.id);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFilePreview(result);
        
        if (file.type.startsWith('image/')) {
          setFileType('image');
        } else if (file.type.startsWith('video/')) {
          setFileType('video');
        } else if (file.type.startsWith('audio/')) {
          setFileType('audio');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const parseAttachment = (attachmentStr: string | null | undefined) => {
    if (!attachmentStr) return { type: null, src: null };
    const match = attachmentStr.match(/^\[(.*?)\](.*)$/);
    return match ? { type: match[1], src: match[2] } : { type: null, src: attachmentStr };
  };

  return {
    // UI States
    isOpen, 
    setIsOpen,
    showTicketList, 
    setShowTicketList,
    fullScreenImage, 
    setFullScreenImage,
    input, 
    setInput,
    isSending,
    loading,
    
    // Attachment/Menu
    filePreview, 
    setFilePreview,
    fileType, 
    setFileType,
    isAttachmentMenuOpen, 
    setIsAttachmentMenuOpen,
    
    // Recording
    isRecording, 
    setIsRecording,
    recordingTime,
    stopRecording, 
    
    // Data
    user, 
    tickets, 
    activeTicket, 
    setActiveTicket,
    messages,
    unreadCount,
    
    // Functions
    sendMessage, 
    deleteMessage, 
    parseAttachment,
    handleFileSelect,
    fetchTickets,
    
    // Refs
    constraintsRef, 
    chatContainerRef
  };
};