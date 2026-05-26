"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";
import { useTickets } from "./hooks/useTickets";
import TicketTable from "./components/TicketTable";
import TicketPagination from "./components/TicketPagination";
import TicketDetailModal from "./components/TicketDetailModal";
import CreateTicketModal from "../../components/createTicketModal";
import EditTicketModal from "../../components/editTicketModal";
import BulkActionBar from "./components/BulkActionBar";
import { getAuthHeaders } from "../../lib/apiClient";
import { API_URL } from "../../config/api";

import { Search, RotateCcw, ArrowLeft, Plus } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function TicketsPage() {
  const {
    user,
    tickets,
    selectedTicket,
    ticketToEdit,
    highlightId,
    isGroupGlowing,
    activeTab,
    mounted,
    isLoading,
    searchQuery,
    isRefreshing,
    currentPage,
    ticketsPerPage,
    isCreateModalOpen,
    sortedTickets,
    currentTickets,
    totalPages,
    indexOfFirstTicket,
    indexOfLastTicket,
    deptAccent,
    availableTabs,
    filteredByRole,
    setSelectedTicket,
    setTicketToEdit,
    setActiveTab,
    setSearchQuery,
    setTicketsPerPage,
    setCurrentPage,
    setIsCreateModalOpen,
    handleRefresh,
    handleSendReminder,
    handleCloseModal,
    handleTicketAction,
    fetchTickets,
    router,
  } = useTickets();

  // New Selection States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string | number>>(new Set());

  // Selection Handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selects only the Finished tickets currently visible on the page
      setSelectedTickets(new Set(currentTickets.filter(t => t.status === "Finished").map(t => t.globalId)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleToggleSelect = (globalId: string | number) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(globalId)) {
        newSet.delete(globalId);
      } else {
        newSet.add(globalId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedTickets(new Set());
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
  };

  // FIXED: Inayos ang connection sa backend API port 5000
  const confirmDelete = async () => {
    setShowDeleteModal(false);
    
    try {
      const idsToDelete = Array.from(selectedTickets);
      
      // I-map ang bawat ID para sa DELETE request sa iyong backend controller
      const deletePromises = idsToDelete.map(globalId =>
       fetch(`${API_URL}/api/tickets/${globalId}`, {
  method: 'DELETE',
  headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  credentials: 'include'
})
      );
      
      // Hintayin matapos ang lahat ng requests
      const results = await Promise.all(deletePromises);
      
      // I-check kung may failed requests
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        console.error(`${failed.length} tickets failed to delete.`);
      }

      // I-refresh ang data mula sa server (gamit ang existing hook function mo)
      await fetchTickets(user);
      
      // Linisin ang checkboxes
      setSelectedTickets(new Set());
      
    } catch (error) {
      console.error('Error deleting tickets:', error);
      alert("Nagkaroon ng error sa pag-delete ng tickets.");
    }
  };

  const getStatusData = (status: string) => {
    switch (status) {
      case "Reminded":
        return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600", dot: "#e11d48" };
      case "Pending":
        return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", dot: "#f59e0b" };
      case "In Progress":
        return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", dot: "#6366f1" };
      case "Resolved":
        return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", dot: "#10b981" };
      case "Finished":
        return { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600", dot: "#06b6d4" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", dot: "#9ca3af" };
    }
  };

  if (!mounted || isLoading || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50 w-full overflow-x-hidden">
      <main className="flex-1 w-full h-screen overflow-hidden bg-slate-50 p-4 sm:p-6">
        {/* Header */}
        <div className="px-4 pt-4 sm:px-0 sm:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6 mb-3 sm:mb-5 lg:mb-7 animate-fadeIn w-full">
          <div className="flex items-center gap-2 lg:gap-3 w-full md:w-auto">
            <button onClick={() => router.push("/dashboard")} className="p-1 sm:p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-100 text-slate-500 transition-all active:scale-95 shadow-sm flex-shrink-0" title="Go back">
              <ArrowLeft size={14} className="sm:w-5 sm:h-5" />
            </button>
            <h1 className={`${montserrat.className} text-xl sm:text-2xl font-semibold tracking-wide text-slate-800`}>
              Ticket Management
            </h1>
          </div>

          <div className="flex flex-row items-center gap-1.5 sm:gap-2 w-full md:w-auto mt-1 md:mt-0">
            <div className="relative flex-1 min-w-[120px] sm:min-w-[200px] lg:min-w-[320px]">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-7 pr-2 sm:pl-8 sm:pr-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition-all font-semibold text-[11px] sm:text-sm shadow-sm" />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={handleRefresh} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center h-[30px] w-[30px] sm:w-auto sm:h-auto">
                <RotateCcw size={14} className={`text-slate-600 sm:w-[16px] sm:h-[16px] ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              {user.role !== "Head" && (
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-1.5 px-0 sm:px-4 py-0 sm:py-2 rounded-lg text-white font-bold transition-all shadow-sm h-[30px] w-[30px] sm:w-auto sm:h-auto" style={{ backgroundColor: deptAccent.color }}>
                  <Plus size={16} className="sm:w-[16px] sm:h-[16px]" strokeWidth={3} />
                  <span className="hidden sm:inline text-sm ml-1.5">New Ticket</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-none sm:rounded-xl border-x-0 sm:border-x border-y sm:border-y border-slate-200 shadow-sm overflow-hidden flex flex-col w-full max-w-full">
          <div className="px-3 sm:px-6 pt-2 sm:pt-5 border-b border-slate-200 w-full overflow-hidden">
            <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-0 smooth-scroll w-full" role="tablist">
              {availableTabs.map((tab) => {
                let count = 0;
                if (tab === "All") count = filteredByRole.filter((t) => t.status !== "Finished").length;
                else if (tab === "Reminders") count = filteredByRole.filter((t) => t.status === "Pending" && t.reminder_flag).length;
                else if (tab === "Pending") count = filteredByRole.filter((t) => t.status === "Pending" && !t.reminder_flag).length;
                else if (tab === "In Progress") count = filteredByRole.filter((t) => t.status === "In Progress" || t.status === "Resolved").length;
                else count = filteredByRole.filter((t) => t.status === tab).length;

                const isActive = activeTab === tab;
                return (
                  <button key={tab} role="tab" onClick={() => setActiveTab(tab)} className={`pb-2 sm:pb-3 flex items-center gap-1 sm:gap-2 border-b-2 sm:border-b-4 transition-all whitespace-nowrap ${isActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                    <span className="font-black text-[9px] sm:text-xs uppercase tracking-widest">{tab}</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black ${isActive ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bulk Action Bar - Sticky positioning between Tabs and Table */}
          <div className="px-3 sm:px-6 pt-3"> 
            <BulkActionBar 
              selectedCount={selectedTickets.size} 
              onDelete={handleBulkDelete} 
              onClear={handleClearSelection} 
            />
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto w-full smooth-scroll min-h-[480px] lg:min-h-[550px] flex flex-col justify-between">
            <TicketTable
              tickets={currentTickets}
              user={user}
              highlightId={highlightId}
              isGroupGlowing={isGroupGlowing}
              activeTab={activeTab}
              onSelect={setSelectedTicket}
              onAction={handleTicketAction}
              onEdit={setTicketToEdit}
              onRemind={handleSendReminder}
              getStatusData={getStatusData}
              deptAccent={deptAccent}
              onToggleSelectAll={handleToggleSelectAll}
              selectedTickets={selectedTickets}
              handleToggleSelect={handleToggleSelect}
              handleBulkDelete={handleBulkDelete}
              handleClearSelection={handleClearSelection}
              showDeleteModal={showDeleteModal}
              setShowDeleteModal={setShowDeleteModal}
              confirmDelete={confirmDelete}
            />
          </div>

          {/* Pagination */}
          <TicketPagination
            currentPage={currentPage}
            totalPages={totalPages}
            ticketsPerPage={ticketsPerPage}
            totalCount={sortedTickets.length}
            startIndex={indexOfFirstTicket}
            endIndex={indexOfLastTicket}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setTicketsPerPage}
          />
        </div>

        {/* Modals */}
        <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchTickets(user)} />
        <EditTicketModal isOpen={!!ticketToEdit} ticket={ticketToEdit} onClose={() => setTicketToEdit(null)} onSuccess={() => { fetchTickets(user); setTicketToEdit(null); }} />
      </main>

      {/* Detail Modal */}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={handleCloseModal} deptAccent={deptAccent} />}

      {/* Styles */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');body{font-family:'DM Sans',sans-serif;overflow-x:hidden;}h1,h2,h3{font-family:'Syne',sans-serif;}.smooth-scroll{scrollbar-width:none;-ms-overflow-style:none;}.smooth-scroll::-webkit-scrollbar{display:none;}.responsive-main{margin-left:0;width:100%;max-width:100%;box-sizing:border-box;}@media(min-width:1024px){.responsive-main{margin-left:var(--sidebar-width,256px);width:calc(100% - var(--sidebar-width,256px));}}@keyframes slideUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}.animate-slideUp{animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1);}.animate-fadeIn{animation:fadeIn 0.2s ease-out forwards;}@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}@keyframes glowRose{0%{background-color:rgba(225,29,72,0.2);}100%{background-color:transparent;}}@keyframes glowAmber{0%{background-color:rgba(245,158,11,0.2);}100%{background-color:transparent;}}@keyframes glowIndigo{0%{background-color:rgba(99,102,241,0.2);}100%{background-color:transparent;}}@keyframes glowGreen{0%{background-color:rgba(16,185,129,0.2);}100%{background-color:transparent;}}@keyframes glowCyan{0%{background-color:rgba(6,182,212,0.2);}100%{background-color:transparent;}}@keyframes glowSlate{0%{background-color:rgba(100,116,139,0.2);}100%{background-color:transparent;}}@keyframes highlightPulse{0%,100%{background-color:rgba(20,184,166,0.1);}50%{background-color:rgba(20,184,166,0.4);}}.animate-glowRose{animation:glowRose 2.5s ease-out forwards;}.animate-glowAmber{animation:glowAmber 2.5s ease-out forwards;}.animate-glowIndigo{animation:glowIndigo 2.5s ease-out forwards;}.animate-glowGreen{animation:glowGreen 2.5s ease-out forwards;}.animate-glowCyan{animation:glowCyan 2.5s ease-out forwards;}.animate-glowSlate{animation:glowSlate 2.5s ease-out forwards;}.animate-highlightPulse{animation:highlightPulse 1.5s ease-in-out infinite;}@media(max-width:480px){.responsive-main{padding:0!important;}.hide-on-mobile{display:none!important;}table{width:100%!important;min-width:100%!important;}}`}</style>
    </div>
  );
}