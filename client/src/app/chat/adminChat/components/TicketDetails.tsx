"use client";
import React from "react";
import { X } from "lucide-react";

type Props = {
  selectedTicket: any;
  isInfoOpen: boolean;
  setIsInfoOpen: (val: boolean) => void;
  getStatusColor: (status: string) => string;
};

export default function TicketDetails({
  selectedTicket,
  isInfoOpen,
  setIsInfoOpen,
  getStatusColor,
}: Props) {
  if (!selectedTicket) return null;

  return (
    <>
      {isInfoOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[50] xl:hidden"
          onClick={() => setIsInfoOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 bottom-0 w-[200px] bg-white z-[60] transition-transform duration-300 ease-in-out shadow-2xl ${
          isInfoOpen ? "translate-x-0" : "translate-x-full"
        } xl:static xl:translate-x-0 xl:flex xl:flex-col xl:w-72 xl:border-l xl:border-slate-200 xl:bg-white xl:shadow-none`}
      >
        <div className="p-5 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6 xl:hidden">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
              Information
            </h3>
            <button
              onClick={() => setIsInfoOpen(false)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <h3 className="hidden xl:block font-bold text-xs mb-6 text-slate-400 uppercase tracking-widest">
            Ticket Info
          </h3>

          <div className="space-y-5">
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                Status
              </p>
              <span
                className={`inline-flex px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(selectedTicket.status)}`}
              >
                {selectedTicket.status}
              </span>
            </div>

            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Ticket ID
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                #{selectedTicket.id}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Category
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {selectedTicket.category}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                Date Created
              </p>
              <p className="text-xs font-medium text-slate-700 mt-1">
                {selectedTicket.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}