
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCircle, PlayCircle, Star, X } from "lucide-react";
import type { Ticket, User, DeptAccent } from "../types/tickets";
import SuccessModal from "../../../components/SuccessModal";
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";
import { formatTicketNumber } from "../../../lib/ticketFormatter";

interface ActionButtonsProps {
  ticket: Ticket;
  user: User;
  onAction: (globalId: string | number, payload: any) => void;
  onEdit: (ticket: Ticket) => void;
  onRemind: (globalId: string | number) => void;
  deptAccent?: DeptAccent;
}

const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc5fBJkx89BBVKkLFqan7Fn7KxTd0MLfs5B2Z7Qeeu-OVTJ8w/viewform";
const ENTRY_ID = "entry.1195195768";

export default function ActionButtons({
  ticket,
  user,
  onAction,
  onEdit,
  onRemind,
  deptAccent,
}: ActionButtonsProps) {
  const [isConfirmingDone, setIsConfirmingDone] = useState(false);
  const [showConfirmSuccessModal, setShowConfirmSuccessModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isReviewDone, setIsReviewDone] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const targetTicketNum = ticket.ticket_number || ticket.globalId;
  const googleFormLink = `${GOOGLE_FORM_BASE_URL}?embedded=true&${ENTRY_ID}=${targetTicketNum}`;

  const checkSurveyStatus = async () => {
    if (!ticket.globalId) return;
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.globalId}/survey-status`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setIsReviewDone(data.userMarkedDone === 1 || data.userMarkedDone === true);
      }
    } catch (error) {
      console.error("❌ Failed to verify survey status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (ticket.status === "Resolved") {
      checkSurveyStatus();
    }
  }, [ticket.globalId, ticket.status]);

  const handleCloseModal = async () => {
    await checkSurveyStatus();
    setOpenReviewModal(false);
  };

  const handleConfirmDone = async () => {
    setIsConfirmingDone(true);
    try {
      await onAction(ticket.globalId, { status: "Finished" });
      setShowConfirmSuccessModal(true);
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (error) {
      alert("Failed to confirm done.");
    } finally {
      setIsConfirmingDone(false);
    }
  };

  
 const baseBtnStyle = "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold tracking-wider uppercase rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] select-none focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer";
  const iconSizeStyle = "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0";

  return (
    <>
      <div className="flex gap-2 items-center justify-end flex-wrap sm:flex-nowrap">
        {user?.role === "User" && String(ticket.createdBy) === String(user?.username) && (
          <div className="flex gap-2 items-center">
            {ticket.status === "Pending" && (
              <>
                {/* ... (Keep your Edit/Nudge buttons here) ... */}
              </>
            )}

            {/* 🟢 MODIFIED SECTION: Logic for Resolved vs Finished */}
            {ticket.status === "Resolved" && (
              <>
                {!ticket.userMarkedDone ? (
                  <>
                    <button className={`${baseBtnStyle} bg-purple-600 hover:bg-purple-700 text-white`} onClick={() => setOpenReviewModal(true)}>
                      <Star className={iconSizeStyle} /> <span>Review</span>
                    </button>
                    <button 
                      disabled={!isReviewDone || isConfirmingDone || isCheckingStatus} 
                      className={`${baseBtnStyle} ${!isReviewDone ? "bg-slate-400 opacity-50" : "bg-blue-600 hover:bg-blue-700"} text-white`} 
                      onClick={handleConfirmDone}
                    >
                      <CheckCircle className={iconSizeStyle} /> <span>Confirm Done</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className={iconSizeStyle} /> <span>Completed</span>
                  </div>
                )}
              </>
            )}
            
            {ticket.status === "Finished" && (
               <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">
                 <CheckCircle className={iconSizeStyle} /> <span>Completed</span>
               </div>
            )}
          </div>
        )}

      {/* HEAD ACTIONS: Accept and Resolve only */}
      {user?.role === "Head" && (
        <div className="flex gap-2 items-center">
          {ticket.status === "Pending" && (
            <button
              type="button"
              className={`${baseBtnStyle} text-white shadow-sm focus:ring-green-500`}
              style={{ backgroundColor: deptAccent?.color || "#16a34a" ,cursor: "pointer"}}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAction(ticket.globalId, { status: "In Progress" });
              }}
            >
              <PlayCircle className={iconSizeStyle} />
              <span>Accept</span>
            </button>
          )}

          {ticket.status === "In Progress" && (
            <button
              type="button"
              className={`${baseBtnStyle} bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 focus:ring-emerald-500`}
              onClick={(e) => {
                e.stopPropagation();
                onAction(ticket.globalId, { status: "Resolved" });
              }}
            >
              <CheckCircle className={iconSizeStyle} />
              <span>Resolve</span>
            </button>
          )}

          {ticket.status === "Resolved" && !ticket.headMarkedDone && (
            <>
              <button
                type="button"
                className={`${baseBtnStyle} bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 focus:ring-amber-500`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(ticket.globalId, { status: "Pending" });
                }}
              >
                <Bell className={iconSizeStyle} />
                <span>Follow Up</span>
              </button>
              
              <button
                type="button"
                className={`${baseBtnStyle} bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 focus:ring-blue-500 font-extrabold`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(ticket.globalId, { headMarkedDone: true });
                }}
              >
                <CheckCircle className={iconSizeStyle} />
                <span>Finish</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>


    {/* Review Modal with Google Form */}
    {createPortal(
      <>
        {openReviewModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] transition-opacity duration-300"
              onClick={handleCloseModal} // 🟢 Ginamit ang handleCloseModal na may validation check sa halip na basta isara lang
            />
            {/* Modal */}
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
                  <div>
                    <h2 className="text-xl font-bold text-white">Ticket Review</h2>
                    <p className="text-purple-100 text-sm mt-1">{ticket.ticket_number ? formatTicketNumber(ticket.ticket_number) : `Ticket #${ticket.globalId}`}</p>
                  </div>
                  <button
                    onClick={handleCloseModal} // 🟢 Ginamit din dito para sa pag-click ng 'X' icon
                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  <p className="text-gray-600 text-sm mb-4 text-center">
                    Please complete the feedback form before finishing the ticket.
                  </p>
                  
                  {!iframeLoaded && (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                    </div>
                  )}
                  
                  <iframe
                    src={googleFormLink}
                    className="w-full h-full border-0 rounded-lg min-h-[500px]"
                    onLoad={() => setIframeLoaded(true)}
                    title="Google Form Review"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </>,
      document.body
    )}

    {/* Confirm Done Success Modal */}
    {createPortal(
      <SuccessModal
        open={showConfirmSuccessModal}
        title="Ticket Successfully Finished ✅"
        message="Thank you! The ticket has been successfully completed and closed."
        icon="check"
        onClose={() => setShowConfirmSuccessModal(false)}
        autoCloseDelay={2000}
      />,
      document.body
    )}
    </>
  );
}