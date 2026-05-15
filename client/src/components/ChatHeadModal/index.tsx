"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageArea } from "./MessageArea";
import { ChatInput } from "./ChatInput";
import { ChatTrigger } from "./ChatTrigger";
import { useChatLogic } from "./useChatLogic";
import { ChatHeader } from "./ChatHeader";

export default function ChatHeadModal() {
  const {
    isOpen, setIsOpen,
    showTicketList, setShowTicketList,
    fullScreenImage, setFullScreenImage,
    input, setInput,
    isSending,
    filePreview, setFilePreview,
    fileType, setFileType,
    user, tickets, activeTicket, setActiveTicket,
    messages,
    sendMessage, deleteMessage, parseAttachment,
    constraintsRef, chatContainerRef,
    isAttachmentMenuOpen, setIsAttachmentMenuOpen,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  } = useChatLogic();

  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

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

  if (!user) return null;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9999]">
        <motion.div 
          drag 
          dragConstraints={constraintsRef} 
          className="absolute bottom-6 right-6 font-sans pointer-events-auto origin-bottom-right"
        >
          <div className="absolute bottom-full right-0 mb-4">
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="w-[320px] sm:w-[384px] h-[500px] sm:h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                >
                  <ChatHeader 
                    activeTicket={activeTicket}
                    showTicketList={showTicketList}
                    setShowTicketList={setShowTicketList}
                    setIsOpen={setIsOpen} 
                    tickets={tickets}
                    setActiveTicket={setActiveTicket}
                  />

                  <MessageArea 
                    messages={messages}
                    user={user}
                    activeTicket={activeTicket}
                    chatContainerRef={chatContainerRef}
                    deleteMessage={deleteMessage}
                    setFullScreenImage={setFullScreenImage}
                    parseAttachment={parseAttachment}
                  />

                  <ChatInput 
                    input={input}
                    setInput={setInput}
                    activeTicket={activeTicket}
                    isSending={isSending}
                    sendMessage={sendMessage}
                    filePreview={filePreview}
                    fileType={fileType}
                    removeFile={() => { setFilePreview(null); setFileType(null); }}
                    handleFileSelect={handleFileSelect}
                    isAttachmentMenuOpen={isAttachmentMenuOpen}
                    setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
                    galleryInputRef={galleryInputRef}
                    cameraInputRef={cameraInputRef}
                    videoInputRef={videoInputRef}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    startRecording={startRecording}
                    stopRecording={stopRecording} 
                    formatTime={(s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ChatTrigger 
            isOpen={isOpen} 
            setIsOpen={setIsOpen} 
            unseenCount={tickets.length} 
          />
        </motion.div>
      </div>

      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 cursor-pointer" 
          onClick={() => setFullScreenImage(null)}
        >
          <img src={fullScreenImage} alt="Full screen" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  );
}
