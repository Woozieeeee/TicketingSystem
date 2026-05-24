"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Star } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  title: string;
  message: string;
  icon?: "check" | "star";
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function SuccessModal({
  open,
  title,
  message,
  icon = "check",
  onClose,
  autoCloseDelay = 2500,
}: SuccessModalProps) {
  useEffect(() => {
    if (open && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-emerald-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-center">
                  {icon === "check" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      <CheckCircle size={48} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      <Star size={48} className="text-white fill-white" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-gray-800 mb-2"
                >
                  {title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 text-sm"
                >
                  {message}
                </motion.p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
