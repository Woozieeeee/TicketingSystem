import React from "react";
import { motion } from "framer-motion";

interface ChatTriggerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  unseenCount: number;
}

export const ChatTrigger = ({ isOpen, setIsOpen, unseenCount }: ChatTriggerProps) => {
  return (
    <motion.button
      layout="position"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(!isOpen)}
      className={`bg-green-700 shadow-2xl shadow-green-300 flex items-center justify-center relative transition-all duration-300 ${
        isOpen ? 'w-14 h-14 rounded-2xl' : 'w-16 h-16 rounded-[24px]'
      }`}
    >
      {isOpen ? (
        // Icon kapag bukas ang chat
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <>
          {/* Main Chat Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          
          {/* Notification Badge */}
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-bold animate-bounce shadow-lg">
              {unseenCount > 99 ? '99+' : unseenCount}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
};