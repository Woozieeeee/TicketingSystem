import React from "react"; 
import { motion } from "framer-motion";
import { Trash2, Ban } from "lucide-react";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

interface MessageAreaProps {
  messages: any[];
  user: any;
  activeTicket: any;
  chatContainerRef: React.RefObject<HTMLDivElement | null>; 
  deleteMessage: (id: any) => void;
  setFullScreenImage: (src: string | null) => void;
  parseAttachment: (attachmentStr: string | null | undefined) => { type: string | null; src: string | null };
}

export const MessageArea = ({
  messages,
  user,
  activeTicket,
  chatContainerRef,
  deleteMessage,
  setFullScreenImage,
  parseAttachment,
}: MessageAreaProps) => {

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50/50 z-10 relative flex flex-col-reverse gap-4"
    >
      {[...messages].reverse().map((msg) => {
        const isSystemMsg =
          msg.sender?.toLowerCase() === "system" ||
          msg.message?.toLowerCase().startsWith("system:");

        if (isSystemMsg) {
          const displayMessage = msg.message.replace(/^System:\s*/i, "");
          return (
            <div key={msg.id} className="flex justify-center my-2 w-full">
              <span className="bg-white text-gray-500 text-[10px] sm:text-[11px] px-4 py-1.5 rounded-full font-medium border border-gray-200 shadow-sm text-center max-w-[90%]">
                {displayMessage}
              </span>
            </div>
          );
        }

        const isMe =
          user.role === "Head"
            ? msg.sender !== activeTicket?.user
            : msg.sender === user.username;
        const isDeleted = msg.message === "[DELETED]";
        const { type: attachType, src: attachSrc } = parseAttachment(msg.attachment);

        return (
          <div
            key={msg.id}
            className={`flex items-center group gap-2 ${isMe ? "justify-end" : "justify-start"} w-full`}
          >
            {/* Delete Button */}
            {isMe && activeTicket?.status !== "Finished" && !isDeleted && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                title="Delete message"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[80%]`}>
              {!isMe && (
                <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">
                  {msg.sender}
                </span>
              )}

              {isDeleted ? (
                <div
                  className={`p-2.5 px-4 rounded-2xl shadow-sm text-[11px] italic flex items-center gap-1.5 ${
                    isMe 
                      ? "bg-slate-100 text-slate-500 border border-slate-200 rounded-tr-none" 
                      : "bg-slate-100 text-slate-500 border border-slate-200 rounded-tl-none"
                  }`}
                >
                  <Ban size={12} className="opacity-70" /> {isMe ? "You" : msg.sender} deleted a message
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 5 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`p-3 sm:p-3.5 rounded-2xl text-[13px] sm:text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                    isMe
                      ? "bg-green-700 text-white rounded-tr-none"
                      : "bg-white text-gray-700 rounded-tl-none border border-gray-100"
                  }`}
                >
                  {/* RENDER ATTACHMENTS */}
                  {attachSrc && (
                    <div className="mb-2">
                      {attachType === "image" && (
                        <img
                          src={attachSrc}
                          alt="Attachment"
                          className="max-h-[140px] sm:max-h-[180px] w-auto object-contain rounded-lg bg-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullScreenImage(attachSrc)}
                        />
                      )}
                      
                      {attachType === "video" && (
                        <video
                          src={attachSrc}
                          controls
                          className="max-h-[180px] w-auto rounded-lg border border-black/10 bg-black"
                        />
                      )}

                      {attachType === "audio" && (
                        <CustomAudioPlayer src={attachSrc} isMe={isMe} />
                      )}
                    </div>
                  )}
                  
                  {msg.message && <span>{msg.message}</span>}
                </motion.div>
              )}

              <span className="text-[9px] text-gray-400 mt-1 mx-1">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {activeTicket && messages.length === 0 && (
        <div className="w-full h-full flex items-center justify-center flex-col mt-10">
          <p className="text-center text-xs text-gray-400">No messages yet. Say hello!</p>
        </div>
      )}

      {/* Chat ID Header */}
      {activeTicket && (
        <div className="text-center py-2 sticky top-0 z-10 w-full mb-auto mt-2">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1 rounded-full shadow-sm uppercase tracking-tighter inline-block">
            Chat ID: {activeTicket.globalId}
          </span>
        </div>
      )}
    </div>
  );
};