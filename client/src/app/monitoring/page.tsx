"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { IT_TEAM, getStatsForRange } from "./constants/teamData";
import Header from "./components/Header";
import PersonnelList from "./components/PersonnelList";
import StatsDashboard from "./components/StatsDashboard";
import { TeamMember, DashboardView } from "./types/monitoring";
// 1. IMPORT FRAMER MOTION
import { motion, AnimatePresence } from "framer-motion"; 

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  Clock,
  ShieldCheck,
  Download,
  RotateCcw,
  Search,
} from "lucide-react";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Ito ang gumagawa ng "staggered" effect
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

export default function ITHeadViewDashboard() {
  const [view, setView] = useState<"list" | "stats">("list");
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [timeRange, setTimeRange] = useState("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStats, setCurrentStats] = useState({
    pending: 0,
    ongoing: 0,
    resolved: 0,
  });
  const [liveTime, setLiveTime] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayFormatted = new Date().toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    setIsMounted(true);
    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      if (!displayDate) setDisplayDate(todayFormatted);
    };
    const timerId = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timerId);
  }, [displayDate, todayFormatted]);

  useEffect(() => {
    if (selectedUser) setCurrentStats(getStatsForRange());
  }, [selectedUser, timeRange, displayDate]);

  const filteredTeam = useMemo(() => {
    return IT_TEAM.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  if (!isMounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* 2. WRAP MAIN IN MOTION.DIV FOR INITIAL PAGE FADE-IN */}
      <motion.main 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex-1 w-full h-screen overflow-hidden bg-slate-50 p-4 sm:p-6"
      >
        {/* HEADER SECTION - WRAPPED IN ITEMVARIANTS */}
        <motion.div variants={itemVariants}>
          <Header 
            view={view} 
            setView={setView} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            displayDate={displayDate}
            setDisplayDate={setDisplayDate}
            liveTime={liveTime}
            todayFormatted={todayFormatted}
            dateInputRef={dateInputRef}
          />
        </motion.div>

        {/* 3. USE ANIMATEPRESENCE FOR SMOOTH VIEW TRANSITIONS */}
        <AnimatePresence mode="wait">
          {/* VIEW 1: PERSONNEL DIRECTORY */}
          {view === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonnelList 
                filteredTeam={filteredTeam} 
                onUserClick={(user) => {
                  setSelectedUser(user);
                  setView("stats");
                }} 
              />
            </motion.div>
          )}

          {/* VIEW 2: STATISTICS & ANALYTICS */}
          {view === "stats" && selectedUser && (
            <motion.div
              key="stats-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <StatsDashboard 
                selectedUser={selectedUser}
                currentStats={currentStats}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }

        .search-icon-animated { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .search-input:focus ~ .search-icon-animated { color: #10b981; }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
        
        .responsive-main { margin-left: 0px; }
        @media (min-width: 1024px) { .responsive-main { margin-left: var(--sidebar-width, 256px); } }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}