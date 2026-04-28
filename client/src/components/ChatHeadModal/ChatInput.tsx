import React from "react";
import { 
  X, Paperclip, ImageIcon, Video, Camera, Mic, Square, Send 
} from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  activeTicket: any;
  isSending: boolean;
  sendMessage: () => void;
  filePreview: string | null;
  fileType: string | null;
  removeFile: () => void;
  isAttachmentMenuOpen: boolean;
  setIsAttachmentMenuOpen: (val: boolean) => void;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
}

export const ChatInput = ({
  input, setInput, activeTicket, isSending, sendMessage,
  filePreview, fileType, removeFile,
  isAttachmentMenuOpen, setIsAttachmentMenuOpen,
  galleryInputRef, videoInputRef, cameraInputRef,
  handleFileSelect, isRecording, recordingTime,
  startRecording, stopRecording, formatTime
}: ChatInputProps) => {

  // Helper para malaman kung may isesend (text o file)
  const hasContent = input.trim() !== "" || filePreview !== null;

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex flex-col gap-2 z-20">
      {/* File Preview Section */}
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
          <button onClick={removeFile} className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-900 transition shadow-md">
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center w-full relative">
        {/* Overlay para maisara ang menu */}
        {isAttachmentMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsAttachmentMenuOpen(false)} />}
        
        {/* Attachment Menu Pop-out */}
        {isAttachmentMenuOpen && (
          <div className="absolute bottom-[110%] left-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-1 flex flex-col w-40 z-50 origin-bottom-left animate-popOut">
            <button onClick={() => { galleryInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700">
              <ImageIcon size={16} className="text-blue-500" /> Photo
            </button>
            <button onClick={() => { videoInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border-t border-slate-100">
              <Video size={16} className="text-purple-500" /> Video
            </button>
            <button onClick={() => { cameraInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border-t border-slate-100">
              <Camera size={16} className="text-emerald-500" /> Camera
            </button>
          </div>
        )}

        {/* Paperclip Button */}
        <button
          onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
          disabled={isRecording}
          className={`p-2 rounded-full transition-colors ${isAttachmentMenuOpen ? "bg-green-200 text-green-800" : "bg-slate-100 text-slate-500 hover:bg-green-50"} ${isRecording && "opacity-50"}`}
        >
          <Paperclip size={18} />
        </button>

        {/* Hidden File Inputs */}
        <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileSelect} />
        <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleFileSelect} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileSelect} />

        {/* Input Field / Recording Overlay */}
        {isRecording ? (
          <div className="flex-1 flex items-center px-4 bg-slate-100 rounded-xl h-[42px] sm:h-[46px] animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs font-bold text-red-500">Recording {formatTime(recordingTime)}</span>
          </div>
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!activeTicket || isSending}
            placeholder={activeTicket ? "Message..." : "Select a ticket first"}
            className="flex-1 h-[42px] sm:h-[46px] text-sm focus:outline-none text-gray-700 bg-gray-100 px-3 rounded-xl border border-transparent focus:border-green-400 transition-all disabled:opacity-50"
          />
        )}

        {/* Action Button: Send or Mic/Stop */}
        <button
          onClick={hasContent ? sendMessage : (isRecording ? stopRecording : startRecording)}
          disabled={!activeTicket || isSending}
          className={`flex-shrink-0 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl flex items-center justify-center transition-all ${
            hasContent 
              ? "bg-green-600 text-white shadow-md active:scale-95" 
              : (isRecording ? "bg-red-500 text-white animate-pulse" : "bg-green-600 text-white active:scale-95")
          } disabled:bg-slate-300 disabled:shadow-none`}
        >
          {hasContent ? (
            <Send size={18} />
          ) : (
            isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />
          )}
        </button>
      </div>
    </div>
  );
};