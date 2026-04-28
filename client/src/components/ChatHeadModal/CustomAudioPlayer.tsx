"use client";
import React, { useState, useRef } from "react";
import { Square, Play } from "lucide-react";

interface CustomAudioPlayerProps {
  src: string;
  isMe?: boolean;
}

export const CustomAudioPlayer = ({ src, isMe }: CustomAudioPlayerProps) => {
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
      // Safety check para sa duration para hindi mag-NaN ang progress
      const currentProgress = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
      setProgress(currentProgress);
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

  // Safe value para sa progress bar
  const safeProgress = isNaN(progress) ? 0 : progress;

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl w-[200px] sm:w-[240px] mb-2 ${
        isMe
          ? "bg-black/10 text-white" // Binalik sa black/10 base sa "from this"
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
            ? "bg-white text-green-700"
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
          value={safeProgress}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current"
          style={{
            background: isMe
              ? `linear-gradient(to right, white ${safeProgress}%, rgba(0,0,0,0.2) ${safeProgress}%)`
              : `linear-gradient(to right, #64748b ${safeProgress}%, #cbd5e1 ${safeProgress}%)`,
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