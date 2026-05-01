"use client";

import React, { useState, useRef } from "react";
import { Play, Square } from "lucide-react";

// Custom Audio Player Component
export const CustomAudioPlayer = ({
  src,
  isMe,
}: {
  src: string;
  isMe: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
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
    if (audioRef.current) setDuration(audioRef.current.duration);
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
      className={`flex items-center gap-3 p-2 rounded-xl w-[200px] sm:w-[240px] mb-2 ${isMe ? "bg-black/10 text-white" : "bg-slate-100 border border-slate-200 text-slate-700"}`}
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
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-95 ${isMe ? "bg-white text-green-700" : "bg-white text-slate-700 shadow-sm border border-slate-200"}`}
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
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: isMe
              ? `linear-gradient(to right, white ${progress}%, rgba(0,0,0,0.2) ${progress}%)`
              : `linear-gradient(to right, #64748b ${progress}%, #cbd5e1 ${progress}%)`,
          }}
        />
        <div
          className={`text-[9px] font-bold flex justify-between mt-0.5 ${isMe ? "text-white/80" : "text-slate-500"}`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// CSS Styles Component
export const GlobalStyles = () => (
  <style>{`
    .responsive-chat { margin-left: 0px; width: 100vw; max-width: 100vw; transition: margin-left 0.3s ease-in-out, width 0.3s ease-in-out; overflow-x: hidden; } 
    @media (min-width: 768px) { .responsive-chat { width: 100%; max-width: 100%; margin-left: var(--sidebar-width, 256px); width: calc(100% - var(--sidebar-width, 256px)); } }
    
    .smooth-scroll { scrollbar-width: none; -ms-overflow-style: none; }
    .smooth-scroll::-webkit-scrollbar { display: none; }
    @keyframes popOut { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-popOut { animation: popOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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
);

// Status color helper
export const getStatusColor = (status: string) => {
  if (status === "Pending")
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "In Progress")
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (status === "Resolved")
    return "bg-green-50 text-green-700 border-green-200";
  if (status === "Finished")
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

// Format status helper
export const formatStatus = (s: string) => {
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "PENDING") return "Pending";
  if (s === "RESOLVED") return "Resolved";
  if (s === "FINISHED") return "Finished";
  return "Open";
};

// Parse attachment helper
export const parseAttachment = (attachmentStr: string | null) => {
  if (!attachmentStr) return { type: null, src: null };
  if (attachmentStr.startsWith("[video]"))
    return { type: "video", src: attachmentStr.replace("[video]", "") };
  if (attachmentStr.startsWith("[audio]"))
    return { type: "audio", src: attachmentStr.replace("[audio]", "") };
  if (attachmentStr.startsWith("[image]"))
    return { type: "image", src: attachmentStr.replace("[image]", "") };
  return { type: "image", src: attachmentStr };
};

// Format time helper
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
