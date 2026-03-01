"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2, MessageCircle } from "lucide-react"; // 🟢 Added MessageCircle
import { useRouter } from "next/navigation"; // 🟢 Added useRouter for the chat link
import Swal from "sweetalert2";
import { API_URL } from "../config/api"; // 🟢 Centralized API URL

interface EditTicketModalProps {
  isOpen: boolean;
  ticket: Record<string, any> | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTicketModal({
  isOpen,
  ticket,
  onClose,
  onSuccess,
}: EditTicketModalProps) {
  const router = useRouter(); // 🟢 Initialize router
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && ticket) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        category: ticket.category || "",
      });
    }
  }, [isOpen, ticket]);

  if (!isOpen || !ticket || !user || !mounted) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // SAFETY SWITCH: 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.globalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to update");

      onSuccess();
      onClose();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ticket Updated",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === "AbortError";
      Swal.fire({
        icon: "error",
        title: isTimeout ? "Server Timeout" : "Update Failed",
        text: isTimeout
          ? "Server took too long. Restart backend."
          : "Check server connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div
          className="px-8 py-6 flex items-center justify-between w-full"
          style={{ backgroundColor: "#15803d" }}
        >
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            Edit Ticket{" "}
            <span
              className="text-sm font-semibold bg-green-800 px-3 py-1 rounded-md"
              title="Unique Ticket ID"
            >
              #{ticket.id}
            </span>
          </h2>
          <button
            onClick={onClose}
            title="Cancel and close window"
            className="p-2 hover:bg-green-800 rounded-lg text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* 🟢 UX IMPROVEMENT: The Hybrid Guidance Box */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3.5 items-start shadow-sm">
            <MessageCircle
              size={22}
              className="text-blue-500 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">
                Quick Tip: Editing vs. Chatting
              </p>
              <p className="text-sm font-medium text-blue-800 leading-relaxed">
                Use this form to fix typos or change the core category of your
                request. If you just want to ask a question, send a file, or
                provide a quick update, please use the
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      user?.role === "Head"
                        ? "/chat/adminChat"
                        : "/chat/userChat",
                    )
                  }
                  className="font-bold underline ml-1 hover:text-blue-600 transition-colors"
                  title="Click here to jump straight to the chat"
                >
                  Ticket Chat
                </button>{" "}
                instead!
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              title="What type of issue is this? (e.g., Hardware, Software, Network)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Change category name..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Subject Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              title="A short summary of your request"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="E.g., Printer in Room 102 is jammed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Description
            </label>
            <textarea
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleChange}
              title="Provide as many details as possible so support can help you faster"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
              placeholder="Please describe the issue in detail..."
            />
          </div>
        </div>

        {/* FIXED FOOTER */}
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
    </div>,
    document.body,
  );
}
