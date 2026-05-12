"use client";

import TicketRow from "./TicketRow";
import type { Ticket, User, DeptAccent } from "../types/tickets";

interface TicketTableProps {
  tickets: Ticket[];
  user: User;
  highlightId: string | null;
  isGroupGlowing: boolean;
  activeTab: string;
  onSelect: (ticket: Ticket) => void;
  onAction: (globalId: string | number, payload: any) => void;
  onEdit: (ticket: Ticket) => void;
  onRemind: (globalId: string | number) => void;
  getStatusData: (status: string) => { bg: string; border: string; text: string; dot: string };
  deptAccent: DeptAccent;
}

export default function TicketTable({
  tickets,
  user,
  highlightId,
  isGroupGlowing,
  activeTab,
  onSelect,
  onAction,
  onEdit,
  onRemind,
  getStatusData,
  deptAccent,
}: TicketTableProps) {
  return (
    <table className="w-full text-left whitespace-nowrap min-w-full sm:min-w-[550px]">
      <thead>
        <tr className="text-[7.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
          {user.role === "Head" && (
            <th className="px-2 sm:px-6 py-2.5 font-black">Sender</th>
          )}
          <th className="px-2 sm:px-6 py-2.5 font-black">Cat.</th>
          <th className="px-2 sm:px-6 py-2.5 font-black">Subject</th>
          <th className="px-2 sm:px-6 py-2.5 font-black">Status</th>
          <th className="px-2 sm:px-6 py-2.5 font-black">Date</th>
          <th className="px-2 sm:px-6 py-2.5 font-black text-right">Opt.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.globalId}
            ticket={ticket}
            user={user}
            highlightId={highlightId}
            isGroupGlowing={isGroupGlowing}
            activeTab={activeTab}
            onSelect={onSelect}
            onAction={onAction}
            onEdit={onEdit}
            onRemind={onRemind}
            getStatusData={getStatusData}
            deptAccent={deptAccent}
          />
        ))}
      </tbody>
    </table>
  );
}