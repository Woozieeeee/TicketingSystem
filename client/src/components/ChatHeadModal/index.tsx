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
    // Galing sa hook para sa attachment at voice recording
    isAttachmentMenuOpen, setIsAttachmentMenuOpen,
    isRecording, setIsRecording,
    recordingTime,
    stopRecording
  } = useChatLogic();

  // Refs para sa file inputs
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) console.log("File selected:", file.name);
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
                  {/* Ginamit ang setIsOpen para sa pag-close ng modal */}
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
                    removeFile={() => setFilePreview(null)}
                    handleFileSelect={handleFileSelect}
                    isAttachmentMenuOpen={isAttachmentMenuOpen}
                    setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
                    galleryInputRef={galleryInputRef}
                    cameraInputRef={cameraInputRef}
                    videoInputRef={videoInputRef}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    startRecording={() => setIsRecording(true)}
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

      {/* Full Screen Image Overlay */}
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