"use client";

import React, { useState, useRef } from "react";
import ChatList from "../adminChat/components/ChatList";
import ChatWindow from "../adminChat/components/ChatWindow";
import TicketDetails from "../adminChat/components/TicketDetails";


// NOTE: You already have this in your original file
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

  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [isOpponentTyping, setIsOpponentTyping] = useState(false);

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // ---------------- REFS ----------------
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ---------------- HELPERS ----------------
  const parseAttachment = (attachment: any) => {
    if (!attachment) return { type: "", src: "" };

    if (attachment.includes("image"))
      return { type: "image", src: attachment };
    if (attachment.includes("video"))
      return { type: "video", src: attachment };
    if (attachment.includes("audio"))
      return { type: "audio", src: attachment };

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

  const handleSend = () => {
    if (!messageInput.trim()) return;

    setIsSending(true);

    const newMessage = {
      id: Date.now(),
      sender: "Support Admin",
      message: messageInput,
      attachment: null,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setMessageInput("");

    setTimeout(() => setIsSending(false), 300);
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

    const url = URL.createObjectURL(file);
    setFilePreview(url);

    if (file.type.startsWith("image")) setFileType("image");
    else if (file.type.startsWith("video")) setFileType("video");
    else if (file.type.startsWith("audio")) setFileType("audio");
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
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

  // Dummy Audio Player (since you passed it as prop)
  const CustomAudioPlayer = ({ src }: any) => (
    <audio controls src={src} />
  );

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden responsive-chat">
        {/* LEFT SIDEBAR */}
        <ChatList
          tickets={tickets}
          selectedTicket={selectedTicket}
          onSelectTicket={setSelectedTicket}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedTicket={setSelectedTicket}
        />

        {/* MAIN CHAT */}
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
        />

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
            className="max-w-full max-h-[90vh]"
          />
        </div>
      )}
    </>
  );
}