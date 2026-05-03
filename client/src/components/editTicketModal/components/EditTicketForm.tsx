"use client";

import { MessageCircle } from "lucide-react";
import type { FormData, User } from "../types";

interface EditTicketFormProps {
  formData: FormData;
  user: User | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onGoToChat: () => void;
}

export default function EditTicketForm({
  formData,
  user,
  onChange,
  onGoToChat,
}: EditTicketFormProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* UX Improvement: The Hybrid Guidance Box */}
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
              onClick={onGoToChat}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          title="Provide as many details as possible so support can help you faster"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
          placeholder="Please describe the issue in detail..."
        />
      </div>
    </div>
  );
}
