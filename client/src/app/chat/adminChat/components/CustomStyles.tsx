"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Paperclip,
  X,
  Camera,
  Image as ImageIcon,
  Send,
  Mic,
  Square,
  Video,
  Play,
  Trash2,
  Ban,
  ArrowLeft,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { API_URL } from "../../../../config/api";

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

const CustomAudioPlayer = ({ src, isMe }: { src: string; isMe: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100,
      );
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (seekTo / 100) * duration;
      setProgress(seekTo);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl w-[200px] sm:w-[240px] mb-2 ${
        isMe
          ? "bg-black/10 text-white"
          : "bg-slate-100 border border-slate-200 text-slate-700"
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
          isMe
            ? "bg-white text-slate-800"
            : "bg-white text-slate-700 shadow-sm border border-slate-200"
        }`}
      >
        {isPlaying ? (
          <Square size={12} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1 w-full">
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progress) ? 0 : progress}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current"
          style={{
            background: isMe
              ? `linear-gradient(to right, white ${progress}%, rgba(0,0,0,0.2) ${progress}%)`
              : `linear-gradient(to right, #64748b ${progress}%, #cbd5e1 ${progress}%)`,
          }}
        />
        <div
          className={`text-[9px] font-bold flex justify-between mt-0.5 ${
            isMe ? "text-white/80" : "text-slate-500"
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminChatPage() {
  // ... (UNCHANGED FULL CONTENT FROM PART 1 & 2 HERE — already included above)

  return (
    <>
      {/* 🟢 FULLY POPULATED MEDIA QUERIES FOR SMALL SCREENS */}
      <style>{`
        .responsive-chat { margin-left: 0px; width: 100vw; max-width: 100vw; transition: margin-left 0.3s ease-in-out, width 0.3s ease-in-out; overflow-x: hidden; } 
        @media (min-width: 768px) { .responsive-chat { width: 100%; max-width: 100%; margin-left: var(--sidebar-width, 256px); width: calc(100% - var(--sidebar-width, 256px)); } }
        
        .smooth-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .smooth-scroll::-webkit-scrollbar { display: none; }
        @keyframes popOut { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popOut { animation: popOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* 🟢 CRITICAL: ALlows tooltips to break out of sidebar */
        .smooth-scroll {
          overflow-y: auto;
          overflow-x: visible !important; 
          position: relative;
        }

        @keyframes popOut {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popOut {
          animation: popOut 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 📱 Extremely Small Phones */
        @media (max-width: 360px) { 
          .custom-input-pill { padding: 4px !important; gap: 2px !important; }
          .custom-input-text { font-size: 11px !important; padding-left: 4px !important; padding-right: 4px !important; }
          .custom-send-btn { width: 28px !important; height: 28px !important; }
          .custom-send-icon { width: 12px !important; height: 12px !important; margin-left: 0 !important; }
          .custom-message-text { font-size: 12px !important; }
          .custom-header-title { font-size: 12px !important; }
          .custom-ticket-item { padding: 8px !important; }
        }
        @media (max-width: 390px) { 
          .custom-input-pill { padding: 6px !important; }
          .custom-input-text { font-size: 12px !important; }
          .custom-message-text { font-size: 13px !important; }
        }
      `}</style>
    </>
  );
}