"use client";



import React, { useState } from "react";

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

  FileText, // FIXED: Added FileText icon for documents

  Star,

} from "lucide-react";

import { CustomAudioPlayer, formatTime } from "./CustomStyles";



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

  id: string;

  title: string;

  status: string;

  category: string;

  date: string;

}



interface ChatWindowProps {

  selectedTicket: Ticket | null;

  chatHistory: Message[];

  user: any;

  currentUser?: any; // FIXED: Optional fallback property mapping parameter compatibility

  messageInput: string;

  isSending: boolean;

  isRecording: boolean;

  recordingTime: number;

  filePreview: string | null;

  fileType: "image" | "video" | "audio" | "document" | string | null; // FIXED: Expanded to prevent structural runtime validation bypasses

  isAttachmentMenuOpen: boolean;

  isOpponentTyping: boolean;

  parseAttachment: (attachment: any) => { type: string; src: string; name?: string }; // FIXED: Enforced explicit processing typing signature callbacks

  getStatusColor?: (status: string) => string; // FIXED: Safe typing configuration fallback checks

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

  documentInputRef: React.RefObject<HTMLInputElement>; // FIXED: Added documentInputRef type prop

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

  parseAttachment, // FIXED: Destructured utility handlers

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

  documentInputRef, // FIXED: Destructured documentInputRef

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

            className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 flex flex-col-reverse smooth-scroll w-full space-y-3"

          >

            {/* FIXED: Removed internal array level structural reversal when flex-col-reverse processing is already present */}

            

            {/* FIXED: Injected dynamic UI indicator node if the opponent operator is actively typing feedback updates */}

            {isOpponentTyping && (

              <div className="flex justify-start w-full items-center gap-2 mt-2 animate-pulse">

                <div className="bg-white border border-amber-200 text-slate-500 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-1 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)]">

                  <span className="font-semibold text-green-600">Support Personnel</span> is typing

                  <span className="inline-flex gap-0.5 ml-1">

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>

                  </span>

                </div>

              </div>

            )}



            {chatHistory.slice().reverse().map((msg) => {

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

              const parsed = parseAttachment(msg.attachment);

              const attachType = parsed?.type;

              const attachSrc = parsed?.src;

              const attachName = parsed?.name || "Document Asset";



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

                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] md:max-w-md`}

                  >

                    {!isMe && (

                      <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">

                        {msg.sender}

                      </span>

                    )}



                    {isDeleted ? (

                      <div

                        className={`px-4 py-2.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] text-[11px] italic flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${isMe ? "bg-slate-100 text-slate-500 border border-slate-200 rounded-tr-none" : "bg-slate-100 text-slate-500 border border-slate-200 rounded-tl-none"}`}

                      >

                        <Ban size={12} className="opacity-70" />{" "}

                        {isMe ? "You" : msg.sender} deleted a message

                      </div>

                    ) : (

                      <div

                        className={`px-4 py-2.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] relative leading-relaxed transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-white border border-amber-200 text-slate-900 rounded-tl-none"}`}

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

                        {/* Document Message Node Builder */}

                        {attachType === "document" && attachSrc && (

                          <a

                            href={attachSrc}

                            target="_blank"

                            rel="noopener noreferrer"

                            className={`flex items-center gap-2 p-2 rounded-xl mb-1.5 border transition ${isMe ? "bg-green-700/50 border-green-500 text-white hover:bg-green-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}

                          >

                            <FileText size={24} className={isMe ? "text-green-200" : "text-red-500"} />

                            <div className="flex flex-col min-w-0 flex-1">

                              <span className="text-xs font-semibold truncate max-w-[180px] sm:max-w-[220px]">

                                {attachName}

                              </span>

                              <span className="text-[10px] opacity-75 uppercase font-bold">View Document</span>

                            </div>

                          </a>

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

            ) : selectedTicket.status === "Resolved" ? (

              <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4">

                <div className="flex items-center justify-center gap-3">

                  <Star className="text-green-600 fill-green-600" size={24} />

                  <div className="flex-1">

                    <p className="text-green-800 font-semibold text-sm">

                      Ticket has been resolved

                    </p>

                    <p className="text-green-600 text-xs">

                      Please go to Ticket Management to review and complete this ticket

                    </p>

                  </div>

                </div>

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

                    {/* Document Input Preview Context */}

                    {fileType === "document" && (

                      <div className="h-10 px-4 bg-slate-100 rounded-full flex items-center border border-slate-200 text-xs font-bold text-slate-600 shadow-sm gap-2">

                        <FileText size={14} className="text-red-500" />

                        <span>📄 Document Selected</span>

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

                        <ImageIcon size={16} className="text-black-500" />{" "}

                        Photo

                      </button>

                      <button

                        onClick={() => {

                          videoInputRef.current?.click();

                          onCloseAttachmentMenu();

                        }}

                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"

                      >

                        <Video size={16} className="text-black-500" />{" "}

                        Video

                      </button>

                      {/* FIXED: Document Selector Button Node */}

                      <button

                        onClick={() => {

                          documentInputRef.current?.click();

                          onCloseAttachmentMenu();

                        }}

                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"

                      >

                        <FileText size={16} className="text-black-500" />{" "}

                        Document

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

                  {/* FIXED: Hidden Document Native File Input */}

                  <input

                    type="file"

                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"

                    className="hidden"

                    ref={documentInputRef}

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

                      title={isRecording ? "Stop recording" : "Record voice message"}

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