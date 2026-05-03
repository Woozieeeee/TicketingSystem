"use client";

import { createPortal } from "react-dom";
import { Save, Loader2 } from "lucide-react";
import { useEditTicket } from "./hooks/useEditTicket";
import EditTicketHeader from "./components/EditTicketHeader";
import EditTicketForm from "./components/EditTicketForm";
import type { EditTicketModalProps } from "./types";

export default function EditTicketModal({
  isOpen,
  ticket,
  onClose,
  onSuccess,
}: EditTicketModalProps) {
  const {
    mounted,
    isSubmitting,
    user,
    formData,
    handleChange,
    handleSubmit,
    goToChat,
  } = useEditTicket(isOpen, ticket, onClose, onSuccess);

  if (!isOpen || !ticket || !user || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp w-full"
        style={{ maxWidth: "1000px" }}
      >
        <EditTicketHeader ticketId={ticket.id} onClose={onClose} />

        <EditTicketForm
          formData={formData}
          user={user}
          onChange={handleChange}
          onGoToChat={goToChat}
        />

        {/* Fixed Footer */}
        <div className="w-full border-t border-slate-200 bg-slate-50 px-8 py-5 flex items-center justify-between">
          <div /> {/* Pushes the buttons to the right */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              title="Discard changes and close"
              className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-bold transition-colors hover:bg-slate-100"
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
              onClick={handleSubmit}
              title="Save your updated ticket details"
              className="flex items-center justify-center min-w-[160px] gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>,
    document.body,
  );
}
