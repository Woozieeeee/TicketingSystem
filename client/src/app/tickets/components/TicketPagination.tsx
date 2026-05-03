import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  ticketsPerPage: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export const TicketPagination = ({ 
  currentPage, totalPages, ticketsPerPage, totalCount, startIndex, endIndex, onPageChange, onRowsPerPageChange 
}: Props) => (
  <div className="px-3 py-2 sm:px-6 sm:py-4 border-t border-slate-200 flex flex-row items-center justify-between gap-1 bg-slate-50/50 w-full rounded-b-xl">
    <div className="text-[9px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
      {startIndex + 1}-{Math.min(endIndex, totalCount)} 
      <span className="hidden sm:inline"> of {totalCount}</span>
    </div>

    <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-full p-0.5 sm:p-1">
      <button 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="p-1 sm:px-2 text-teal-600 disabled:opacity-40"
      >
        <ChevronLeft size={14} strokeWidth={3} />
      </button>
      <div className="flex items-center px-1">
        <button className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-teal-500 text-white text-[10px] font-bold">
          {currentPage}
        </button>
      </div>
      <button 
        disabled={currentPage === totalPages || totalPages === 0} 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="p-1 sm:px-2 text-teal-600 disabled:opacity-40"
      >
        <ChevronRight size={14} strokeWidth={3} />
      </button>
    </div>

    <div className="flex items-center gap-1">
      <span className="text-[9px] sm:text-xs font-bold text-slate-500 hidden sm:inline">Rows:</span>
      <select 
        value={ticketsPerPage} 
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        className="p-0.5 border border-slate-200 rounded text-[9px] font-bold text-slate-600"
      >
        {[5, 10, 20].map(val => <option key={val} value={val}>{val}</option>)}
      </select>
    </div>
  </div>
);
export default TicketPagination;