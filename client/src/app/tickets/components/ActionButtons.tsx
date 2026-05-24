"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCircle, PlayCircle, Star } from "lucide-react";
import type { Ticket, User, DeptAccent } from "../types/tickets";
import ReviewModal from "../../../components/ReviewModal";
import SuccessModal from "../../../components/SuccessModal";
import { API_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";

interface ActionButtonsProps {
  ticket: Ticket;
  user: User;
  onAction: (globalId: string | number, payload: any) => void;
  onEdit: (ticket: Ticket) => void;
  onRemind: (globalId: string | number) => void;
  deptAccent?: DeptAccent;
}

export default function ActionButtons({
  ticket,
  user,
  onAction,
  onEdit,
  onRemind,
  deptAccent,
}: ActionButtonsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isConfirmingDone, setIsConfirmingDone] = useState(false);
  const [showReviewSuccessModal, setShowReviewSuccessModal] = useState(false);
  const [showConfirmSuccessModal, setShowConfirmSuccessModal] = useState(false);

  // Check if review exists for this ticket
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!ticket || ticket.status !== "Resolved") {
        setReviewSubmitted(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/reviews/ticket/${typeof ticket.globalId === 'string' ? ticket.globalId : String(ticket.globalId)}`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) {
          setReviewSubmitted(true);
        } else {
          setReviewSubmitted(false);
        }
      } catch (error) {
        setReviewSubmitted(false);
      }
    };

    checkReviewStatus();
  }, [ticket]);

  const handleConfirmDone = async () => {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userObj.username) {
      alert("User not authenticated");
      return;
    }

    setIsConfirmingDone(true);

    try {
      const res = await fetch(`${API_URL}/api/reviews/confirm/${typeof ticket.globalId === 'string' ? ticket.globalId : String(ticket.globalId)}`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username: userObj.username }),
      });

      if (res.ok) {
        setShowConfirmSuccessModal(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to confirm done");
      }
    } catch (error) {
      alert("Failed to confirm done. Please try again.");
    } finally {
      setIsConfirmingDone(false);
    }
  };

  const handleReviewSubmitted = () => {
    setReviewSubmitted(true);
    setIsReviewModalOpen(false);
    setShowReviewSuccessModal(true);
  };

  const minutesPast =
    (new Date().getTime() - new Date(ticket.date).getTime()) / 60000;

  // Reusable Tailwind style presets to eliminate repetition while maintaining look & feel
  const baseBtnStyle = "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold tracking-wider uppercase rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] select-none focus:outline-none focus:ring-2 focus:ring-offset-1";

  const iconSizeStyle = "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0";

  return (
    <>
      <div className="flex gap-2 items-center justify-end flex-wrap sm:flex-nowrap">
        {/* USER ACTIONS: Edit, Nudge, and Confirm Done */}
        {user?.role === "User" &&
          String(ticket.createdBy) === String(user?.username) && (
            <div className="flex gap-2 items-center">
            
            {/* 1. LALABAS LANG PAG PENDING */}
            {ticket.status === "Pending" && (
              <>
                <button
                  type="button"
                  title="Edit Ticket"
                  className="p-2 sm:p-2.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ticket);
                  }}
                >
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    viewBox="0 0 24 24" 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>

                {ticket.reminder_flag ? (
                  <span className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold tracking-wider uppercase rounded-lg border border-rose-200 bg-rose-50 text-rose-600 shadow-sm select-none animate-pulse">
                    Reminded
                  </span>
                ) : minutesPast >= 5 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemind(ticket.globalId);
                    }}
                    className={`${baseBtnStyle} border border-amber-300 bg-white hover:bg-amber-50 text-amber-700 hover:border-amber-400 focus:ring-amber-500`}
                  >
                    <Bell className={iconSizeStyle} />
                    <span>Nudge</span>
                  </button>
                ) : null}
              </>
            )}

            {/* 2. Only appears when ticket is RESOLVED */}
            {ticket.status === "Resolved" && !ticket.userMarkedDone && (
              <>
                {!reviewSubmitted ? (
                  <>
                    <button
                      type="button"
                      className={`${baseBtnStyle} bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100 focus:ring-purple-500`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReviewModalOpen(true);
                      }}
                    >
                      <Star className={iconSizeStyle} />
                      <span>Review</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className={`${baseBtnStyle} bg-slate-100 text-slate-400 cursor-not-allowed opacity-50`}
                    >
                      <CheckCircle className={iconSizeStyle} />
                      <span>Confirm Done</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled
                      className={`${baseBtnStyle} bg-emerald-100 text-emerald-600 cursor-not-allowed`}
                    >
                      <Star className={iconSizeStyle} />
                      <span>Reviewed ✓</span>
                    </button>
                    <button
                      type="button"
                      disabled={isConfirmingDone}
                      className={`${baseBtnStyle} bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmDone();
                      }}
                    >
                      <CheckCircle className={iconSizeStyle} />
                      <span>{isConfirmingDone ? "Confirming..." : "Confirm Done"}</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

      {/* HEAD ACTIONS: Accept and Resolve only */}
      {user?.role === "Head" && (
        <div className="flex gap-2 items-center">
          {/* if pending, only accept button will show */}
          {ticket.status === "Pending" && (
            <button
              type="button"
              className={`${baseBtnStyle} text-white shadow-sm focus:ring-green-500`}
              style={{ backgroundColor: deptAccent?.color || "#16a34a" }}
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

          {/* if In Progress, Resolve is the action button */}
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

          {/* Confirm Button, it will show or appear if tickets are RESOLVED */}
          {ticket.status === "Resolved" && !ticket.headMarkedDone && (
            <>
              <button
                type="button"
                className={`${baseBtnStyle} bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 focus:ring-amber-500`}
                onClick={(e) => {
                  e.stopPropagation();
                  // For now it will change to "Follow Up" of "Pending"
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

    {/* Review Modal */}
    {ticket && isReviewModalOpen && createPortal(
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        ticketId={typeof ticket.globalId === 'string' ? ticket.globalId : String(ticket.globalId)}
        ticketGlobalId={typeof ticket.globalId === 'string' ? ticket.globalId : String(ticket.globalId)}
        assignedTo="IT Staff"
        department={ticket.dept || "IT"}
        onReviewSubmitted={handleReviewSubmitted}
      />,
      document.body
    )}

    {/* Review Success Modal */}
    {createPortal(
      <SuccessModal
        open={showReviewSuccessModal}
        title="Review Submitted Successfully ⭐"
        message="Thank you for helping improve our IT services."
        icon="star"
        onClose={() => setShowReviewSuccessModal(false)}
        autoCloseDelay={2500}
      />,
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