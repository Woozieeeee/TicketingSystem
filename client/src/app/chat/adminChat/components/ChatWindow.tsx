import React from 'react';

import { X, Info, Trash2, Ban, Paperclip, ImageIcon, Video, Camera, Mic, Square, Send, FileText } from 'lucide-react';



interface ChatWindowProps {

  selectedTicket: any;

  setSelectedTicket: (ticket: any) => void;

  setIsInfoOpen: (open: boolean) => void;

  chatContainerRef: React.RefObject<HTMLDivElement>;

  chatHistory: any[];

  parseAttachment: (attachment: any) => { type: string; src: string; name?: string };

  getStatusColor: (status: string) => string;

  deleteMessage: (id: number) => void;

  setFullScreenImage: (src: string | null) => void;

  isOpponentTyping: boolean;

  messageInput: string;

  handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;

  handleSend: () => void;

  isSending: boolean;

  filePreview: string | null;

  fileType: string | null;

  removeFile: () => void;

  isAttachmentMenuOpen: boolean;

  setIsAttachmentMenuOpen: (open: boolean) => void;

  galleryInputRef: React.RefObject<HTMLInputElement>;

  videoInputRef: React.RefObject<HTMLInputElement>;

  cameraInputRef: React.RefObject<HTMLInputElement>;

  documentInputRef: React.RefObject<HTMLInputElement>;

  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

  isRecording: boolean;

  recordingTime: number;

  startRecording: () => void;

  stopRecording: () => void;

  formatTime: (seconds: number) => string;

  CustomAudioPlayer: any;

  currentUser?: any;

}



const ChatWindow: React.FC<ChatWindowProps> = ({

  selectedTicket,

  setSelectedTicket,

  currentUser,

  setIsInfoOpen,

  chatContainerRef,

  chatHistory,

  parseAttachment,

  getStatusColor,

  deleteMessage,

  setFullScreenImage,

  isOpponentTyping,

  messageInput,

  handleTyping,

  handleSend,

  isSending,

  filePreview,

  fileType,

  removeFile,

  isAttachmentMenuOpen,

  setIsAttachmentMenuOpen,

  galleryInputRef,

  videoInputRef,

  cameraInputRef,

  documentInputRef,

  handleFileSelect,

  isRecording,

  recordingTime,

  startRecording,

  stopRecording,

  formatTime,

  CustomAudioPlayer

}) => {

  return (

    <div

      className={`${!selectedTicket ? "hidden md:flex" : "flex"} flex-1 min-w-0 flex-col bg-white h-full relative z-10 overflow-hidden`}

    >

      {selectedTicket ? (

        <>

          {/* HEADER */}

          <div className="h-14 border-b border-slate-200 shadow-sm flex justify-between items-center bg-white z-10 px-3 md:px-4 flex-shrink-0 w-full">

            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">

              <button

                onClick={() => setSelectedTicket(null)}

                className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full flex-shrink-0 transition-colors"

              >

                <X size={22} />

              </button>

              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xs md:text-sm border border-slate-200 flex-shrink-0">

                {(selectedTicket.user || selectedTicket.createdBy || "?").charAt(0).toUpperCase()}

              </div>

              <div className="flex flex-col truncate flex-1 min-w-0">

                <div className="flex items-center gap-2 mb-0.5 min-w-0">

                  <h2 className="custom-header-title font-bold text-sm text-slate-800 truncate">

                    {selectedTicket.title}

                  </h2>

                  <span

                    className={`hidden sm:inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shadow-sm flex-shrink-0 ${getStatusColor(selectedTicket.status)}`}

                  >

                    {selectedTicket.status}

                  </span>

                </div>

                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">

                  Ticket #{selectedTicket.id} • {selectedTicket.user}

                </p>

              </div>

            </div>

            <button

              onClick={() => setIsInfoOpen(true)}

              className="xl:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full flex-shrink-0 ml-2 transition-colors"

            >

              <Info size={22} />

            </button>

          </div>



          {/* MESSAGES AREA */}

          <div

            ref={chatContainerRef}

            className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 flex flex-col-reverse smooth-scroll w-full space-y-3"

          >

            {[...chatHistory].reverse().map((msg) => {

              if (msg.sender === "System") {

                let displayMessage = msg.message;

                let isReminder = false;

                if (displayMessage.startsWith("SYS_REMINDER|")) {

                  isReminder = true;

                  const reminderUser = displayMessage.split("|")[1];

                  displayMessage = `⚠️ URGENT: The user (${reminderUser}) has sent a reminder that this ticket is not yet done.`;

                }

                return (

                  <div key={msg.id} className="flex justify-center my-4 w-full">

                    <span

                      className={`text-[9px] px-4 py-2 rounded-full font-bold uppercase tracking-wider shadow-sm border text-center max-w-[90%] leading-relaxed ${isReminder ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-100 text-slate-600 border-slate-200"}`}

                    >

                      {displayMessage}

                    </span>

                  </div>

                );

              }



              const isMe = msg.sender === (currentUser?.username || "Admin");

              const isDeleted = msg.message === "[DELETED]";

              const { type: attachType, src: attachSrc, name: attachName } = parseAttachment(msg.attachment);



              return (

                <div

                  key={msg.id}

                  className={`flex group items-center ${isMe ? "justify-end gap-2" : "justify-start gap-2"} w-full mt-4`}

                >

                  {isMe && selectedTicket.status !== "Finished" && !isDeleted && (

                    <button

                      onClick={() => deleteMessage(msg.id)}

                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"

                      title="Delete message"

                    >

                      <Trash2 size={16} />

                    </button>

                  )}



                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] md:max-w-md`}>

                    {!isMe && (

                      <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1">

                        {msg.sender}

                      </span>

                    )}



                    {isDeleted ? (

                      <div

                        className={`px-4 py-2.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] text-[11px] italic flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${isMe ? "bg-slate-100 text-slate-600 border border-slate-200 rounded-tr-none" : "bg-slate-100 text-slate-600 border border-slate-200 rounded-tl-none"}`}

                      >

                        <Ban size={12} className="opacity-70" /> {isMe ? "You" : msg.sender} deleted a message

                      </div>

                    ) : (

                      <div

                        className={`px-4 py-2.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] relative leading-relaxed transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] ${isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-white border border-amber-200 text-slate-900 rounded-tl-none"}`}

                      >

                        {/* Render Images */}

                        {attachType === "image" && attachSrc && (

                          <img

                            src={attachSrc}

                            alt="Attachment"

                            className="max-h-[160px] sm:max-h-[200px] w-auto rounded-lg mb-1.5 cursor-pointer border border-black/10 active:opacity-50 object-contain bg-black/5"

                            onClick={() => setFullScreenImage(attachSrc)}

                          />

                        )}

                        

                        {/* Render Videos */}

                        {attachType === "video" && attachSrc && (

                          <video

                            src={attachSrc}

                            controls

                            className="max-h-[200px] w-auto rounded-lg mb-1.5 border border-black/10 bg-black"

                          />

                        )}

                        

                        {/* Render Audios */}

                        {attachType === "audio" && attachSrc && (

                          <CustomAudioPlayer src={attachSrc} isMe={isMe} />

                        )}



                        {/* Document Rendering */}

                        {attachType === "document" && attachSrc && (

                          <a

                            href={attachSrc}

                            target="_blank"

                            rel="noopener noreferrer"

                            className={`flex items-center gap-3 p-3 rounded-xl border max-w-[260px] sm:max-w-[300px] transition-all hover:opacity-90 mb-1.5 ${

                              isMe

                                ? "bg-black/10 border-white/20 text-white"

                                : "bg-slate-50 border-slate-200 text-slate-800"

                            }`}

                          >

                            <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-blue-50'}`}>

                              <FileText size={24} className={isMe ? 'text-white' : 'text-blue-600'} />

                            </div>

                            <div className="flex-1 min-w-0">

                              <p className="text-xs font-medium truncate">

                                {attachName || "Attached Document"}

                              </p>

                              <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>

                                Click to view / download

                              </p>

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



            {isOpponentTyping && (

              <div className="flex justify-start items-end gap-2 mt-2 animate-fadeIn w-full">

                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-[10px] border border-slate-200 flex-shrink-0 shadow-sm">

                  {selectedTicket.user.charAt(0).toUpperCase()}

                </div>

                <div className="flex flex-col gap-1">

                  <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-1 w-fit transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)]">

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>

                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>

                  </div>

                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">

                    {selectedTicket.user} is typing...

                  </span>

                </div>

              </div>

            )}

          </div>



          {/* INPUT AREA */}

          <div className="p-2 md:p-3 border-t border-slate-200 bg-white flex-shrink-0 z-50 w-full box-border">

            {selectedTicket.status === "Finished" ? (

              <div className="w-full bg-slate-100 text-slate-600 text-xs font-bold text-center py-3 rounded-xl border border-slate-200 uppercase tracking-widest select-none">

                Ticket is closed.

              </div>

            ) : (

              <div className="flex flex-col gap-2 w-full">

                {filePreview && (

                  <div className="relative self-start mb-1 animate-fadeIn">

                    {fileType === "image" && (

                      <img src={filePreview} alt="Preview" className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" />

                    )}

                    {fileType === "video" && (

                      <video src={filePreview} className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" muted />

                    )}

                    {fileType === "audio" && (

                      <div className="h-10 px-4 bg-slate-100 rounded-full flex items-center border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">

                        🎵 Audio Ready

                      </div>

                    )}

                    {fileType === "document" && (

                      <div className="h-10 px-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-600 shadow-sm">

                        <FileText size={16} /> Document Selected

                      </div>

                    )}

                    <button onClick={removeFile} className="absolute -top-2 -right-2 bg-slate-700 text-white p-1 rounded-full hover:bg-slate-800 transition shadow-md">

                      <X size={10} strokeWidth={3} />

                    </button>

                  </div>

                )}



                <div className="custom-input-pill flex items-center bg-slate-100 p-1 sm:p-1.5 rounded-full border border-slate-200 focus-within:border-green-400 transition-colors relative w-full shadow-sm box-border">

                  {isAttachmentMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsAttachmentMenuOpen(false)} />}

                  

                  {isAttachmentMenuOpen && (

                    <div className="absolute bottom-[110%] left-0 bg-white border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl p-1 flex flex-col w-40 animate-popOut z-50 origin-bottom-left">

                      <button onClick={() => { galleryInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700">

                        <ImageIcon size={16} className="text-slate-500" /> Photo

                      </button>

                      <button onClick={() => { videoInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100">

                        <Video size={16} className="text-slate-500" /> Video

                      </button>

                      <button onClick={() => { cameraInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100">

                        <Camera size={16} className="text-slate-500" /> Camera

                      </button>

                      <button onClick={() => { documentInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100">

                        <FileText size={16} className="text-blue-600" /> Document

                      </button>

                    </div>

                  )}



                  <button

                    onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}

                    className={`p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"}`}

                  >

                    <Paperclip size={18} />

                  </button>



                  {/* Hidden inputs references */}

                  <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileSelect} />

                  <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleFileSelect} />

                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileSelect} />

                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" ref={documentInputRef} onChange={handleFileSelect} />



                  {isRecording ? (

                    <div className="flex-1 flex items-center px-4 bg-slate-200/50 rounded-xl h-[42px] sm:h-[46px] animate-pulse mx-1">

                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>

                      <span className="text-xs font-bold text-red-500">Recording {formatTime(recordingTime)}</span>

                    </div>

                  ) : (

                    <input

                      value={messageInput}

                      onChange={handleTyping}

                      onKeyDown={(e) => e.key === "Enter" && handleSend()}

                      disabled={isSending}

                      placeholder="Type message..."

                      className="custom-input-text flex-1 w-full min-w-0 bg-transparent px-2 py-2 text-[13px] md:text-sm focus:outline-none relative z-10 text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"

                    />

                  )}



                  {!messageInput.trim() && !filePreview ? (

                    <button

                      onClick={isRecording ? stopRecording : startRecording}

                      disabled={isSending}

                      className={`custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}

                    >

                      {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}

                    </button>

                  ) : (

                    <button

                      onClick={handleSend}

                      disabled={isSending}

                      className="custom-send-btn flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 bg-green-600 text-white shadow-md active:scale-95"

                    >

                      <Send size={14} className="custom-send-icon ml-0.5" />

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

};



export default ChatWindow;