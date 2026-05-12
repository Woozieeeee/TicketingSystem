"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { IT_TEAM, getStatsForRange } from "./constants/teamData";
import Header from "./components/Header";
import PersonnelList from "./components/PersonnelList";
import StatsDashboard from "./components/StatsDashboard";
import { TeamMember, DashboardView } from "./types/monitoring";
import { API_URL } from "../../config/api.js";
import { motion, AnimatePresence, Variants } from "framer-motion";

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

// --- Animation Variants (Defined outside to ensure proper scope) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

export default function ITHeadViewDashboard() {
  const [view, setView] = useState<"list" | "stats" | "activities" | "alerts">("list");
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
  
  // Database monitoring state
  const [monitoringStats, setMonitoringStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Database monitoring functions
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  });

  // Fetch monitoring stats from database
  const fetchMonitoringStats = async () => {
    try {
      console.log('🔍 Fetching monitoring stats from:', `${API_URL}/api/monitoring/stats`);
      console.log('🔑 Auth token exists:', !!localStorage.getItem('authToken'));
      
      const response = await fetch(`${API_URL}/api/monitoring/stats`, {
        headers: getAuthHeaders()
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', data);
        console.log('👥 User ticket stats:', data.data?.userTicketStats);
        
        setMonitoringStats(data.data);
        
        // Update current stats with real ticket data
        if (data.data.ticketStats) {
          setCurrentStats({
            pending: data.data.ticketStats.pending_tickets || 0,
            ongoing: data.data.ticketStats.ongoing_tickets || 0,
            resolved: data.data.ticketStats.resolved_tickets || 0,
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch monitoring stats:', error);
    }
  };

  // Fetch user ticket statistics
  const fetchUserTicketStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/user-tickets`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        console.log('👤 User ticket stats response:', data);
        // Store user stats in monitoringStats for easy access
        setMonitoringStats(prev => ({
          ...prev,
          userTicketStats: data.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user ticket stats:', error);
    }
  };

  // Fallback: Fetch users directly if monitoring doesn't work
  const fetchUsersDirectly = async () => {
    try {
      console.log('🔄 Fetching users directly from users API...');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const users = await response.json();
        console.log('👥 Direct users response:', users);
        
        // Convert users to monitoring format
        const userTicketStats = users.map(user => ({
          username: user.username,
          role: user.role,
          dept: user.dept,
          login_count: user.login_count || 0,
          account_created: user.createdAt,
          total_tickets_created: 0, // Will be updated when tickets are fetched
          pending_tickets: 0,
          ongoing_tickets: 0,
          resolved_tickets: 0
        }));
        
        setMonitoringStats(prev => ({
          ...prev,
          userTicketStats
        }));
        
        console.log('✅ Users loaded directly:', userTicketStats.length);
      } else {
        console.error('❌ Failed to fetch users directly:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching users directly:', error);
    }
  };

  // Fetch activities from database
  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/activities?limit=50`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  // Fetch alerts from database
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/alerts?limit=20`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // Load database monitoring data
  const loadMonitoringData = async () => {
    setLoading(true);
    
    try {
      // Try to fetch monitoring stats first
      await fetchMonitoringStats();
      
      // If no user data, try fallback
      if (!monitoringStats?.userTicketStats || monitoringStats.userTicketStats.length === 0) {
        console.log('🔄 No user data from monitoring, trying fallback...');
        await fetchUsersDirectly();
      }
      
      // Fetch other data
      await Promise.all([
        fetchUserTicketStats(),
        fetchActivities(),
        fetchAlerts()
      ]);
    } catch (error) {
      console.error('❌ Error in loadMonitoringData:', error);
      // Try fallback if main fails
      await fetchUsersDirectly();
    }
    
    setLoading(false);
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMonitoringStats();
        fetchAlerts();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredTeam = useMemo(() => {
    // Use real user data from monitoring stats instead of hardcoded IT_TEAM
    const realUsers = monitoringStats?.userTicketStats?.map(user => ({
      id: user.username,
      name: user.username,
      role: user.role,
      dept: user.dept,
      totalTickets: user.total_tickets_created,
      pendingTickets: user.pending_tickets,
      ongoingTickets: user.ongoing_tickets,
      resolvedTickets: user.resolved_tickets,
      loginCount: user.login_count,
      createdAt: user.account_created,
      color: user.role === 'Admin' ? '#10b981' : user.role === 'Staff' ? '#3b82f6' : '#6b7280',
      trend: [user.pending_tickets, user.ongoing_tickets, user.resolved_tickets]
    })) || [];

    return realUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.dept?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, monitoringStats?.userTicketStats]);

  if (!isMounted) return <div className="min-h-screen bg-slate-50" />;

  // Show loading state while fetching data
  if (loading && !monitoringStats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  // Show no data state if no users found
  if (!loading && (!monitoringStats?.userTicketStats || monitoringStats.userTicketStats.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No User Data Available</h2>
          <p className="text-gray-600 mb-4">No users found in the database.</p>
          <button
            onClick={loadMonitoringData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

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
            monitoringStats={monitoringStats}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            loadMonitoringData={loadMonitoringData}
            loading={loading}
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
                userTicketStats={monitoringStats?.userTicketStats}
                monitoringStats={monitoringStats}
              />
            </motion.div>
          )}

          {/* VIEW 3: ACTIVITIES LOG */}
          {view === "activities" && (
            <motion.div
              key="activities-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{activity.username}</div>
                          <div className="text-sm text-gray-600">{activity.action} - {activity.resource}</div>
                          <div className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</div>
                        </div>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {activity.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW 4: SECURITY ALERTS */}
          {view === "alerts" && (
            <motion.div
              key="alerts-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Alerts</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading alerts...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-3 rounded-lg border ${
                        alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{alert.message}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Type: {alert.type} • {new Date(alert.created_at).toLocaleString()}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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