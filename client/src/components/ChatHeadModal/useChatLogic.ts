"use client";
import { useState, useEffect, useRef } from "react";

export const useChatLogic = () => {
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [showTicketList, setShowTicketList] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Attachment & Menu States
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Data States
  const [user] = useState<any>({ id: 1, name: "Student User", username: "student_user", role: "Student" });
  const [tickets] = useState<any[]>([
    { id: 1, displayId: "#1204", globalId: "TKT-1204", user: "Student User", lastMessage: "Sample Ticket", status: 'open', title: "Technical Issue" }
  ]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Refs
  const constraintsRef = useRef(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Timer logic para sa recording
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

  // Auto-scroll logic (Mahalaga para laging nasa huli ang view)
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
    // Temporary placeholder para sa audioUrl
    const audioUrl = ""; 
    
    setFilePreview(audioUrl); 
    setFileType("audio");
  };

  const sendMessage = () => {
    if (!input.trim() && !filePreview) return;

    const newMessage = {
      id: Date.now(),
      sender: user.username,
      message: input,
      attachment: filePreview ? `[${fileType}]${filePreview}` : null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setFilePreview(null);
    setFileType(null);
    setIsAttachmentMenuOpen(false); // Close menu after sending
  };

  // Binalik sa filter logic: Buburahin talaga ang message sa listahan
  const deleteMessage = (id: any) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
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
    
    // Functions
    sendMessage, 
    deleteMessage, 
    parseAttachment,
    
    // Refs
    constraintsRef, 
    chatContainerRef
  };
};