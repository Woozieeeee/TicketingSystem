"use client";

import TicketRow from "./TicketRow";
import type { Ticket, User, DeptAccent } from "../types/tickets";
import DeleteConfirmModal from "./DeleteConfirmModal";

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
  onToggleSelectAll: (checked: boolean) => void;
  selectedTickets: Set<string | number>;
  handleToggleSelect: (globalId: string | number) => void;
  handleBulkDelete: () => void;
  handleClearSelection: () => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  confirmDelete: () => void;
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
  onToggleSelectAll,
  selectedTickets,
  handleToggleSelect,
  handleBulkDelete,
  handleClearSelection,
  showDeleteModal,
  setShowDeleteModal,
  confirmDelete,
}: TicketTableProps) {
  
  // Logic to determine if "Select All" should be checked
  const isAllSelected = tickets.length > 0 && tickets.every(t => selectedTickets.has(t.globalId));
  const isIndeterminate = selectedTickets.size > 0 && !isAllSelected;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-full sm:min-w-[550px]">
          <thead>
            <tr className="text-[7.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              {activeTab === "Finished" && (
                <th className="px-2 sm:px-6 py-2.5 font-black">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={(e) => onToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                  />
                </th>
              )}
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
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
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
                  showCheckbox={activeTab === "Finished"}
                  isSelected={selectedTickets.has(ticket.globalId)}
                  onSelectToggle={handleToggleSelect}
                />
              ))
            ) : (
              <tr>
                <td colSpan={user.role === "Head" ? 8 : 7} className="py-10 text-center text-slate-400 text-sm">
                  No tickets found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        count={selectedTickets.size}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}