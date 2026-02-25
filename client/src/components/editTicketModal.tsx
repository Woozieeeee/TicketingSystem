"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

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
      const res = await fetch(
        `http://localhost:3001/api/tickets/${ticket.globalId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          signal: controller.signal,
        },
      );

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
            <span className="text-sm font-semibold bg-green-800 px-3 py-1 rounded-md">
              #{ticket.id}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-800 rounded-lg text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="w-full border-t border-slate-200 bg-slate-50 px-8 py-5 flex items-center justify-between">
          <div /> {/* Pushes the buttons to the right */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
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
