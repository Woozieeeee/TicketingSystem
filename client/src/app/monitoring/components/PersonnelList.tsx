"use client";
import React from "react";
import { User as UserIcon } from "lucide-react";
import { TeamMember } from "../types/monitoring";
// 1. In-add ang Framer Motion
import { motion } from "framer-motion";

interface PersonnelListProps {
  filteredTeam: TeamMember[];
  onUserClick: (user: TeamMember) => void;
}

// 2. Variants para sa Staggered effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function PersonnelList({
  filteredTeam,
  onUserClick,
}: PersonnelListProps) {
  return (
    // 3. Pinalitan ang main div ng motion.div para sa Staggered Entrance
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {filteredTeam.map((user) => (
        // 4. In-add ang motion.div sa bawat card para sa entrance at hover effects
        <motion.div
          key={user.id}
          variants={itemVariants}
          whileHover={{ y: -5 }} // Micro-interaction: aangat nang konti
          whileTap={{ scale: 0.98 }} // Tactile feedback pag-click
          onClick={() => onUserClick(user)}
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] animate-slideUp"
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
        </motion.div>
      ))}
    </motion.div>
  );
}