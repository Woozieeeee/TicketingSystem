"use client";

import { Trash2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ selectedCount, onDelete, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="animate-fadeIn w-full px-2 sm:px-0">
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 mb-1 flex items-center justify-between shadow-sm">
        <span className="text-sm font-bold text-rose-700">
          {selectedCount} ticket{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}