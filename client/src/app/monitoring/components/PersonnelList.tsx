"use client";
import React from "react";
import { User as UserIcon } from "lucide-react";
import { TeamMember } from "../types/monitoring";



interface PersonnelListProps {
  filteredTeam: TeamMember[];
  onUserClick: (user: TeamMember) => void;
}

export default function PersonnelList({
  filteredTeam,
  onUserClick,
}: PersonnelListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slideUp">
      {filteredTeam.map((user) => (
        <div
          key={user.id}
          onClick={() => onUserClick(user)}
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="flex justify-between mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserIcon size={24} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-full self-start">
              Online
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">
            {user.name}
          </h3>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest truncate">
            {user.role}
          </p>
        </div>
      ))}
    </div>
  );
}