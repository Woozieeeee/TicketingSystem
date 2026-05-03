"use client";

import { X } from "lucide-react";

interface EditTicketHeaderProps {
  ticketId: string | number;
  onClose: () => void;
}

export default function EditTicketHeader({
  ticketId,
  onClose,
}: EditTicketHeaderProps) {
  return (
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
          #{ticketId}
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
  );
}
