"use client";

import type { FormData } from "../types";

interface Step2ReviewProps {
  formData: FormData;
}

export default function Step2Review({ formData }: Step2ReviewProps) {
  return (
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
          {formData.description || "No additional description provided."}
        </div>
      </div>
    </>
  );
}
