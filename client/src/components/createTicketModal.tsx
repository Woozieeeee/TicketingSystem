"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { X, Send, ChevronLeft, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

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
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen || !user || !mounted) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: "PENDING",
        userId: user.id,
        createdBy: user.username,
        dept: user.dept,
        date: new Date().toISOString(),
      };

      const res = await fetch("http://localhost:3001/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

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
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Please check your server connection.",
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
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp w-full"
        style={{ maxWidth: "1000px" }}
      >
        <div
          className="px-8 py-6 flex items-center justify-between w-full"
          style={{ backgroundColor: "#15803d" }}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold text-white">
              {step === 1 ? "Create New Ticket" : "Confirm Details"}
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-white" : "bg-green-800"}`}
              />
              <div
                className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-white" : "bg-green-800"}`}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-800 rounded-lg text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Category
                </label>
                {/* CHANGED: Select dropdown replaced with text input */}
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="e.g. Hardware, Network, Urgent Fix..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Subject Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Summarize your issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={5}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Provide detailed information..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Subject
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {formData.title}
                </p>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Category
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formData.category}
                </p>
              </div>
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Description
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 flex items-center justify-between">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-bold"
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
              onClick={() => (step === 1 ? setStep(2) : handleSubmit())}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : step === 1 ? (
                "Next"
              ) : (
                <>
                  <Send size={18} />
                  Confirm & Send
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
