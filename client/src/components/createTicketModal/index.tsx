"use client";

import { createPortal } from "react-dom";
import { X, Send, ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useCreateTicket } from "./hooks/useCreateTicket";
import Step1Form from "./components/Step1Form";
import Step2Review from "./components/Step2Review";
import type { CreateTicketModalProps } from "./types";

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const {
    mounted,
    step,
    setStep,
    isSubmitting,
    user,
    formData,
    handleClearForm,
    handleChange,
    handleSubmit,
  } = useCreateTicket(isOpen, onClose, onSuccess);

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
        {/* Header */}
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

        {/* Dynamic Body */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 min-h-0 max-w-4xl mx-auto w-full">
          {step === 1 ? (
            <Step1Form formData={formData} onChange={handleChange} />
          ) : (
            <Step2Review formData={formData} />
          )}
        </div>

        {/* Footer Actions */}
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
