"use client";

import React, { useRef } from "react";
import {
  ArrowLeft,
  Info,
  Paperclip,
  X,
  Image as ImageIcon,
  Camera,
  Video,
  Mic,
  Square,
  Send,
  Trash2,
  Ban,
} from "lucide-react";
import { CustomAudioPlayer, parseAttachment, formatTime } from "./CustomStyles";

interface Message {
  id: number;
  ticketId: string;
  sender: string;
  message: string;
  attachment: string | null;
  created_at: string;
}

interface Ticket {
  globalId: string;
  id: number;
  title: string;
  status: string;
  category: string;
  date: string;
}

interface ChatWindowProps {
  selectedTicket: Ticket | null;
  chatHistory: Message[];
  user: any;
  messageInput: string;
  isSending: boolean;
  isRecording: boolean;
  recordingTime: number;
  filePreview: string | null;
  fileType: "image" | "video" | "audio" | null;
  isAttachmentMenuOpen: boolean;
  isOpponentTyping: boolean;
  onBack: () => void;
  onOpenInfo: () => void;
  onSend: () => void;
  onTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteMessage: (messageId: number) => void;
  onToggleAttachmentMenu: () => void;
  onCloseAttachmentMenu: () => void;
  onRemoveFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onSetFullScreenImage: (src: string | null) => void;
}

export default function ChatWindow({
  selectedTicket,
  chatHistory,
  user,
  messageInput,
  isSending,
  isRecording,
  recordingTime,
  filePreview,
  fileType,
  isAttachmentMenuOpen,
  isOpponentTyping,
  onBack,
  onOpenInfo,
  onSend,
  onTyping,
  onDeleteMessage,
  onToggleAttachmentMenu,
  onCloseAttachmentMenu,
  onRemoveFile,
  onStartRecording,
  onStopRecording,
  onFileSelect,
  galleryInputRef,
  cameraInputRef,
  videoInputRef,
  chatContainerRef,
  onSetFullScreenImage,
}: ChatWindowProps) {
  return (
    <div
      className={`${!selectedTicket ? "hidden md:flex" : "flex"} flex-1 flex-col bg-white h-full relative z-10 overflow-hidden w-full max-w-full`}
    >
      {selectedTicket ? (
        <>
          {/* Header */}
          <div className="h-14 border-b border-amber-200 shadow-sm flex justify-between items-center bg-white z-10 px-3 md:px-4 flex-shrink-0 w-full">
            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
              <button
                onClick={onBack}
                className="md:hidden p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
                title="Back to Tickets"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex flex-col truncate flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  <h2 className="custom-header-title font-bold text-sm text-slate-800 truncate">
                    {selectedTicket.title}
                  </h2>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenInfo}
              className="xl:hidden p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors flex-shrink-0 ml-2"
              title="Ticket Information"
            >
              <Info size={22} />
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 flex flex-col-reverse smooth-scroll w-full gap-4"
          >
            {[...chatHistory].reverse().map((msg) => {
              const isSystemMsg = msg.sender === "System";
              if (isSystemMsg)
                return (
                  <div
                    key={msg.id}
                    className="text-center text-xs text-gray-400 my-2"
                  >
                    {msg.message}
                  </div>
                );

              const isMe = msg.sender === user?.username;
              const isDeleted = msg.message === "[DELETED]";
              const { type: attachType, src: attachSrc } = parseAttachment(
                msg.attachment,
              );

              return (
                <div
                  key={msg.id}
                  className={`flex group items-end ${isMe ? "justify-end gap-2" : "justify-start gap-2"} w-full mt-4`}
                >
                  {isMe &&
                    selectedTicket.status !== "Finished" &&
                    !isDeleted && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] md:max-w-md`}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">
                        {msg.sender}
                      </span>
                    )}

                    {isDeleted ? (
                      <div
                        className={`p-2.5 px-4 rounded-2xl shadow-sm text-[11px] italic flex items-center gap-1.5 ${isMe ? "bg-slate-100 text-slate-500 border border-slate-200 rounded-tr-none" : "bg-slate-100 text-slate-500 border border-slate-200 rounded-tl-none"}`}
                      >
                        <Ban size={12} className="opacity-70" />{" "}
                        {isMe ? "You" : msg.sender} deleted a message
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-2xl shadow-sm relative leading-relaxed ${isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-white border border-amber-200 text-slate-900 rounded-tl-none"}`}
                      >
                        {attachType === "image" && attachSrc && (
                          <img
                            src={attachSrc}
                            alt="Attachment"
                            className="max-h-[160px] sm:max-h-[200px] w-auto rounded-lg mb-1.5 cursor-pointer border border-black/10 active:opacity-50 object-contain bg-black/5"
                            onClick={() => onSetFullScreenImage(attachSrc)}
                          />
                        )}
                        {attachType === "video" && attachSrc && (
                          <video
                            src={attachSrc}
                            controls
                            className="max-h-[200px] w-auto rounded-lg mb-1.5 border border-black/10 bg-black"
                          />
                        )}
                        {attachType === "audio" && attachSrc && (
                          <CustomAudioPlayer src={attachSrc} isMe={isMe} />
                        )}

                        {msg.message && (
                          <p className="custom-message-text text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-2 md:p-3 border-t border-slate-200 bg-white flex-shrink-0 z-50 w-full box-border">
            {selectedTicket.status === "Finished" ? (
              <div className="w-full bg-slate-100 text-slate-400 text-xs font-bold text-center py-3 rounded-xl border border-slate-200 uppercase tracking-widest select-none">
                Ticket is closed.
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {/* Preview Section */}
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
                      onClick={onRemoveFile}
                      className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-900 transition shadow-md"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                )}

                <div className="custom-input-pill flex items-center bg-slate-100 p-1 sm:p-1.5 rounded-full border border-slate-200 focus-within:border-green-400 transition-colors relative w-full shadow-sm box-border">
                  {isAttachmentMenuOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={onCloseAttachmentMenu}
                    />
                  )}

                  {isAttachmentMenuOpen && (
                    <div className="absolute bottom-[110%] left-0 bg-white border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl p-1 flex flex-col w-40 animate-popOut z-50 origin-bottom-left">
                      <button
                        onClick={() => {
                          galleryInputRef.current?.click();
                          onCloseAttachmentMenu();
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700"
                      >
                        <ImageIcon size={16} className="text-blue-500" />{" "}
                        Photo
                      </button>
                      <button
                        onClick={() => {
                          videoInputRef.current?.click();
                          onCloseAttachmentMenu();
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                      >
                        <Video size={16} className="text-purple-500" />{" "}
                        Video
                      </button>
                      <button
                        onClick={() => {
                          cameraInputRef.current?.click();
                          onCloseAttachmentMenu();
                        }}
                        className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                      >
                        <Camera size={16} className="text-emerald-500" />{" "}
                        Camera
                      </button>
                    </div>
                  )}

                  <button
                    onClick={onToggleAttachmentMenu}
                    className={`p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-green-200 text-green-800" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={galleryInputRef}
                    onChange={onFileSelect}
                  />
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    ref={videoInputRef}
                    onChange={onFileSelect}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={cameraInputRef}
                    onChange={onFileSelect}
                  />

                  {isRecording ? (
                    <div className="flex-1 flex items-center px-4 bg-slate-200/50 rounded-xl h-[42px] sm:h-[46px] animate-pulse mx-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-xs font-bold text-red-500">
                        Recording {formatTime(recordingTime)}
                      </span>
                    </div>
                  ) : (
                    <input
                      value={messageInput}
                      onChange={onTyping}
                      onKeyDown={(e) => e.key === "Enter" && onSend()}
                      disabled={!selectedTicket || isSending}
                      placeholder="Type message..."
                      className="custom-input-text flex-1 w-full min-w-0 bg-transparent px-2 py-2 text-[13px] md:text-sm focus:outline-none relative z-10 text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  )}

                  {!messageInput.trim() && !filePreview ? (
                    <button
                      onClick={isRecording ? onStopRecording : onStartRecording}
                      disabled={!selectedTicket || isSending}
                      className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 ${isRecording ? "bg-red-500 text-white shadow-md animate-pulse" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                      title={
                        isRecording
                          ? "Stop recording"
                          : "Record voice message"
                      }
                    >
                      {isRecording ? (
                        <Square size={14} fill="currentColor" />
                      ) : (
                        <Mic size={16} />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={onSend}
                      disabled={isSending}
                      className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 bg-green-600 text-white shadow-md active:scale-95 disabled:opacity-50`}
                      title="Send message"
                    >
                      <Send
                        size={14}
                        className="custom-send-icon ml-0.5"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm bg-slate-50/50">
          <p className="font-semibold text-sm">Select a ticket</p>
        </div>
      )}
    </div>
  );
}
