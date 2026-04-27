"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { X, Send, ChevronLeft, Loader2, Trash2, Info } from "lucide-react"; // 🟢 Added Info icon
import Swal from "sweetalert2";
import { API_URL } from "../config/api";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  category: string;
  title: string;
  description: string;
}

interface User {
  id: string;
  username: string;
  dept: string;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>({
    category: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🟢 RESTORE DRAFT ON OPEN
  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user:", error);
        }
      }

      const savedDraft = localStorage.getItem("ticket_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Draft restored",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (e) {
          console.error("Draft restore failed");
        }
      }
      setStep(1);
    }
  }, [isOpen]);

  // 🟢 AUTO-SAVE DRAFT AS USER TYPES
  useEffect(() => {
    if (formData.title || formData.description || formData.category) {
      localStorage.setItem("ticket_draft", JSON.stringify(formData));
    }
  }, [formData]);

  const handleClearForm = () => {
    localStorage.removeItem("ticket_draft");
    setFormData({ category: "", title: "", description: "" });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const payload = {
        ...formData,
        status: "PENDING",
        userId: user?.id,
        createdBy: user?.username,
        dept: user?.dept,
        date: new Date().toISOString(),
      };

      const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to create ticket");

      // 🟢 CLEAR DRAFT ON SUCCESS
      localStorage.removeItem("ticket_draft");
      setFormData({ category: "", title: "", description: "" });

      onSuccess();
      onClose();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ticket created successfully",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === "AbortError";

      Swal.fire({
        icon: "error",
        title: isTimeout ? "Server Timeout" : "Submission Failed",
        text: isTimeout
          ? "The server took too long to respond. Please restart your backend."
          : "Please check your server connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-50 w-full max-w-3xl lg:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] max-h-[850px] animate-slideUp"
      >
        {/* 🟢 HEADER */}
        <div
          className="px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between w-full flex-shrink-0"
          style={{ backgroundColor: "#15803d" }}
        >
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <h2
              className="text-lg sm:text-2xl font-extrabold text-white tracking-wide"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {step === 1 ? "Create New Ticket" : "Confirm Details"}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <div
                title="Step 1: Fill out the form"
                className={`h-1.5 sm:h-2 w-8 sm:w-12 rounded-full transition-colors ${step >= 1 ? "bg-white" : "bg-green-800"}`}
              />
              <div
                title="Step 2: Review and submit"
                className={`h-1.5 sm:h-2 w-8 sm:w-12 rounded-full transition-colors ${step >= 2 ? "bg-white" : "bg-green-800"}`}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cancel and close window (your draft will be saved)"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors active:scale-95"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 🟢 DYNAMIC BODY */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 min-h-0 max-w-4xl mx-auto w-full">
          {/* 🟢 UX IMPROVEMENT: Friendly instruction box for Step 1 */}
          {step === 1 && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start flex-shrink-0">
              <Info size={16} className="text-blue-500 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                Please provide as much detail as possible so our support team
                can help you faster.{" "}
                <span className="font-bold">
                  Don't worry, your progress is automatically saved.
                </span>
              </p>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: FORM */
            <>
              {/* ROW 1: Subject & Category (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-shrink-0">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-2.5 uppercase tracking-wide">
                    Subject Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    title="A short summary of your request"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                    placeholder="Summarize your issue..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-2.5 uppercase tracking-wide">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    title="What type of issue is this? (e.g., Hardware, Software, Network)"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                    placeholder="e.g. Hardware, Network, Urgent Fix..."
                  />
                </div>
              </div>

              {/* ROW 2: Description (Fills remaining space) */}
              <div className="flex-1 flex flex-col min-h-[200px]">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-2.5 uppercase tracking-wide">
                  Detailed Description
                </label>
                <textarea
                  name="description"
                  required
                  title="Explain the issue clearly. The more information, the better."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full flex-1 p-4 sm:p-5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none shadow-sm text-sm sm:text-base leading-relaxed text-slate-700 placeholder:text-slate-400"
                  placeholder="Provide detailed information about your request..."
                />
              </div>
            </>
          ) : (
            /* STEP 2: CONFIRMATION */
            <>
              {/* ROW 1: Subject & Category (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-shrink-0">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Subject
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {formData.title || "No subject provided"}
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Category
                  </span>
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base font-bold text-slate-800 truncate">
                      {formData.category || "Uncategorized"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 2: Description (Fills remaining space, scrolls internally) */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-[200px] overflow-hidden">
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Detailed Description
                  </span>
                </div>
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {formData.description ||
                    "No additional description provided."}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🟢 FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between flex-shrink-0 gap-3 sm:gap-0">
          <div className="w-full sm:w-auto flex justify-start">
            {step === 1 ? (
              <button
                onClick={handleClearForm}
                title="Erase all text and start over"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-rose-500 hover:text-rose-700 font-bold text-xs uppercase tracking-widest transition-colors w-full sm:w-auto bg-rose-50 sm:bg-transparent rounded-xl sm:rounded-none active:scale-95"
              >
                <Trash2 size={16} /> Clear Form
              </button>
            ) : (
              <button
                onClick={() => setStep(1)}
                title="Go back to make changes to your request"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors w-full sm:w-auto bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none active:scale-95"
              >
                <ChevronLeft size={18} /> Back to Edit
              </button>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              title="Close window without submitting"
              className="flex-1 sm:flex-none px-5 py-2.5 sm:py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              disabled={
                isSubmitting ||
                !formData.title ||
                !formData.description ||
                !formData.category
              }
              title={
                step === 1
                  ? "Proceed to review your ticket before sending"
                  : "Submit this ticket to the Admin team"
              }
              onClick={() => (step === 1 ? setStep(2) : handleSubmit())}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : step === 1 ? (
                "Review Ticket"
              ) : (
                <>
                  <Send size={16} /> Confirm & Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>,
    document.body,
  );
}
