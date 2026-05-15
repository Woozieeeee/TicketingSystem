import React from "react";
import { motion } from "framer-motion";
import { Trash2, Ban } from "lucide-react";
import { CustomAudioPlayer, parseAttachment } from "./CustomStyles";

interface MessageAreaProps {
  messages: any[];
  user: any;
  activeTicket: any;
  chatContainerRef: React.RefObject<HTMLDivElement | null>; 
  deleteMessage: (id: any) => void;
  setFullScreenImage: (src: string | null) => void;
}

export const MessageArea = ({
  messages,
  user,
  activeTicket,
  chatContainerRef,
  deleteMessage,
  setFullScreenImage,
}: MessageAreaProps) => {
  return (
    <div
      ref={chatContainerRef}
      className="flex-1 p-3 md:p-6 overflow-y-auto bg-slate-50/50 flex flex-col-reverse smooth-scroll w-full gap-4"
    >
      {[...messages].reverse().map((msg) => {
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
              activeTicket?.status !== "Finished" &&
              !isDeleted && (
                <button
                  onClick={() => deleteMessage(msg.id)}
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
                      onClick={() => setFullScreenImage(attachSrc)}
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
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  )}
                </div>
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
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm bg-slate-50/50">
          <p className="font-semibold text-sm">No messages yet. Say hello!</p>
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