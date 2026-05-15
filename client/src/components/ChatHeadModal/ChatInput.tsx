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
  return (
    <div className="p-2 md:p-3 border-t border-slate-200 bg-white flex-shrink-0 z-50 w-full box-border">
      {activeTicket?.status === "Finished" ? (
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
                onClick={removeFile}
                className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-900 transition shadow-md"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-1 sm:p-1.5 rounded-full border border-slate-200 focus-within:border-green-400 transition-colors relative w-full shadow-sm box-border">
            {isAttachmentMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAttachmentMenuOpen(false)}
              />
            )}

            {isAttachmentMenuOpen && (
              <div className="absolute bottom-[110%] left-0 bg-white border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl p-1 flex flex-col w-40 animate-popOut z-50 origin-bottom-left">
                <button
                  onClick={() => {
                    galleryInputRef.current?.click();
                    setIsAttachmentMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700"
                >
                  <ImageIcon size={16} className="text-blue-500" /> Photo
                </button>
                <button
                  onClick={() => {
                    videoInputRef.current?.click();
                    setIsAttachmentMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                >
                  <Video size={16} className="text-purple-500" /> Video
                </button>
                <button
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setIsAttachmentMenuOpen(false);
                  }}
                  className="md:hidden flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-xs font-bold text-slate-700 border-t border-slate-100"
                >
                  <Camera size={16} className="text-emerald-500" /> Camera
                </button>
              </div>
            )}

            <button
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              disabled={isRecording}
              className={`p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? "bg-green-200 text-green-800" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
            >
              <Paperclip size={18} />
            </button>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={galleryInputRef}
              onChange={handleFileSelect}
            />
            <input
              type="file"
              accept="video/*"
              className="hidden"
              ref={videoInputRef}
              onChange={handleFileSelect}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleFileSelect}
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={!activeTicket || isSending}
                placeholder="Type message..."
                className="flex-1 w-full min-w-0 bg-transparent px-2 py-2 text-[13px] md:text-sm focus:outline-none relative z-10 text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            )}

            {!input.trim() && !filePreview ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!activeTicket || isSending}
                className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 ${isRecording ? "bg-red-500 text-white shadow-md animate-pulse" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
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
                onClick={sendMessage}
                disabled={isSending}
                className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all relative z-10 mr-0.5 bg-green-600 text-white shadow-md active:scale-95 disabled:opacity-50`}
                title="Send message"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};