import React from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export const parseAttachment = (attachmentStr: string | null | undefined) => {
  if (!attachmentStr) return { type: null, src: null };
  const match = attachmentStr.match(/^\[(.*?)\](.*)$/);
  return match ? { type: match[1], src: match[2] } : { type: null, src: attachmentStr };
};

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface CustomAudioPlayerProps {
  src: string;
  isMe: boolean;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

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

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-gray-100'}`}>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <button
        onClick={togglePlay}
        className={`p-1 rounded-full transition-colors ${isMe ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <Volume2 size={14} className={isMe ? 'text-white/70' : 'text-gray-500'} />
    </div>
  );
};