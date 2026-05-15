"use client";

import { Info } from "lucide-react";
import type { FormData } from "../types";

interface Step1FormProps {
  formData: FormData;
onChange: (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => void;
}
export default function Step1Form({ formData, onChange }: Step1FormProps) {
  return (
    <>
      {/* UX Improvement: Friendly instruction box */}
      <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start flex-shrink-0">
        <Info size={16} className="text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-800 font-medium leading-relaxed">
          Please provide as much detail as possible so our support team can help
          you faster.{" "}
          <span className="font-bold">
            Don&apos;t worry, your progress is automatically saved.
          </span>
        </p>
      </div>

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
            onChange={onChange}
            className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
            placeholder="Summarize your issue..."
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-2.5 uppercase tracking-wide">
            Category
          </label>
          <select
  name="category"
  required
  title="What type of issue is this?"
  value={formData.category}
  onChange={onChange}
  className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base font-semibold text-slate-800"
>
  <option value="">Select a category...</option>
  <option value="Hardware">Hardware</option>
  <option value="Software">Software</option>
  <option value="Network">Network</option>
  <option value="Account & Access">Account & Access</option>
  <option value="Request Service">Request Service</option>
  <option value="Other">Other</option>
</select>
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
          onChange={onChange}
          className="w-full flex-1 p-4 sm:p-5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none shadow-sm text-sm sm:text-base leading-relaxed text-slate-700 placeholder:text-slate-400"
          placeholder="Provide detailed information about your request..."
        />
      </div>
    </>
  );
}
