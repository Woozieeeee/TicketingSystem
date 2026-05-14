"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { IT_TEAM } from "./constants/teamData";
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
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [alertFilter, setAlertFilter] = useState("ALL");

  const filteredActivities = useMemo(() => {
    if (activityFilter === "ALL") return activities;
    return activities.filter(a => a.action === activityFilter);
  }, [activities, activityFilter]);

  const filteredAlerts = useMemo(() => {
    if (alertFilter === "ALL") return alerts;
    return alerts.filter(a => a.severity === alertFilter);
  }, [alerts, alertFilter]);

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
    if (selectedUser && monitoringStats?.ticketStats) {
      setCurrentStats({
        pending: monitoringStats.ticketStats.pending_tickets || 0,
        ongoing: monitoringStats.ticketStats.ongoing_tickets || 0,
        resolved: monitoringStats.ticketStats.resolved_tickets || 0,
      });
    }
  }, [selectedUser, timeRange, displayDate, monitoringStats?.ticketStats]);

  // Database monitoring functions
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // Fetch monitoring stats from database
  const fetchMonitoringStats = async () => {
    try {
      console.log('🔍 Fetching monitoring stats from:', `${API_URL}/api/monitoring/stats`);
      console.log('🔑 Auth token exists:', !!localStorage.getItem('token'));
      
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
      const response = await fetch(`${API_URL}/api/monitoring/activities?limit=100`, {
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

  // Fetch alerts from database (both resolved and unresolved)
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/alerts?limit=50&resolved=all`, {
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
        fetchActivities();
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Actions</option>
                      <option value="LOGIN_SUCCESS">Logins</option>
                      <option value="LOGOUT">Logouts</option>
                      <option value="TICKET_CREATED">Tickets Created</option>
                      <option value="TICKET_STATUS_CHANGED">Status Changes</option>
                      <option value="TICKET_UPDATED">Ticket Updates</option>
                      <option value="USER_REGISTERED">Registrations</option>
                      <option value="USER_CREATED">Users Created</option>
                      <option value="USER_UPDATED">Users Updated</option>
                      <option value="USER_DELETED">Users Deleted</option>
                    </select>
                    <button
                      onClick={fetchActivities}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-gray-700 font-medium mb-1">No Activities Yet</h4>
                    <p className="text-sm text-gray-500">Activities will appear here as users interact with the system.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    {filteredActivities.map((activity, index) => {
                      const actionConfig: Record<string, { icon: string; color: string; bg: string }> = {
                        'LOGIN_SUCCESS': { icon: '🔑', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
                        'LOGOUT': { icon: '🚪', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
                        'TICKET_CREATED': { icon: '📝', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
                        'TICKET_STATUS_CHANGED': { icon: '🔄', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
                        'TICKET_UPDATED': { icon: '✏️', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
                        'USER_REGISTERED': { icon: '👤', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                        'USER_CREATED': { icon: '➕', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
                        'USER_UPDATED': { icon: '📋', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                        'USER_DELETED': { icon: '🗑️', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                        'MONITORING_ACCESS': { icon: '📊', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
                      };
                      const config = actionConfig[activity.action] || { icon: '📌', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };

                      const getDescription = (act: any) => {
                        const details = act.details;
                        switch (act.action) {
                          case 'LOGIN_SUCCESS': return `Logged in successfully (Login #${details?.login_count || '?'})`;
                          case 'LOGOUT': return 'Logged out of the system';
                          case 'TICKET_CREATED': return `Created ticket "${details?.title || 'N/A'}" in ${details?.dept || 'N/A'}`;
                          case 'TICKET_STATUS_CHANGED': return `Changed ticket status: ${details?.oldStatus || '?'} → ${details?.newStatus || '?'}`;
                          case 'TICKET_UPDATED': return `Updated ticket "${details?.title || 'N/A'}"`;
                          case 'USER_REGISTERED': return `Registered as ${details?.role || 'User'} in ${details?.dept || 'N/A'}`;
                          case 'USER_CREATED': return `Created user "${details?.newUser || 'N/A'}" (${details?.role || 'User'})`;
                          case 'USER_UPDATED': return `Updated user "${details?.targetUser || 'N/A'}"${details?.previousRole !== details?.role ? ` (role: ${details?.previousRole} → ${details?.role})` : ''}`;
                          case 'USER_DELETED': return `Deleted user "${details?.deletedUser || 'N/A'}" (${details?.role || 'N/A'})`;
                          default: return `${act.action} - ${act.resource || 'N/A'}`;
                        }
                      };

                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors hover:shadow-sm ${config.bg}`}
                        >
                          <div className="text-xl flex-shrink-0 mt-0.5">{config.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${config.color}`}>{activity.username}</span>
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-white/70 border border-gray-200 rounded-full text-gray-600">
                                {activity.role || 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-0.5">{getDescription(activity)}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(activity.created_at).toLocaleString()}
                              </span>
                              {activity.ip_address && (
                                <span className="text-gray-400">IP: {activity.ip_address}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={alertFilter}
                      onChange={(e) => setAlertFilter(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <button
                      onClick={fetchAlerts}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Alert Summary Cards */}
                {alerts.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Critical', severity: 'CRITICAL', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' },
                      { label: 'High', severity: 'HIGH', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50' },
                      { label: 'Medium', severity: 'MEDIUM', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
                      { label: 'Low', severity: 'LOW', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
                    ].map(({ label, severity, color, textColor, bgLight }) => {
                      const count = alerts.filter(a => a.severity === severity).length;
                      return (
                        <div key={severity} className={`${bgLight} rounded-lg p-3 border border-gray-100`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                            <span className="text-xs font-medium text-gray-500">{label}</span>
                          </div>
                          <span className={`text-2xl font-bold ${textColor}`}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading alerts...</p>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-gray-700 font-medium mb-1">All Clear</h4>
                    <p className="text-sm text-gray-500">No security alerts at this time. The system is operating normally.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                    {filteredAlerts.map((alert, index) => {
                      const severityConfig: Record<string, { icon: string; border: string; bg: string; badge: string; badgeText: string }> = {
                        'CRITICAL': { icon: '🔴', border: 'border-red-300', bg: 'bg-red-50', badge: 'bg-red-100', badgeText: 'text-red-800' },
                        'HIGH': { icon: '🟠', border: 'border-orange-300', bg: 'bg-orange-50', badge: 'bg-orange-100', badgeText: 'text-orange-800' },
                        'MEDIUM': { icon: '🟡', border: 'border-yellow-300', bg: 'bg-yellow-50', badge: 'bg-yellow-100', badgeText: 'text-yellow-800' },
                        'LOW': { icon: '🔵', border: 'border-blue-300', bg: 'bg-blue-50', badge: 'bg-blue-100', badgeText: 'text-blue-800' },
                      };
                      const config = severityConfig[alert.severity] || severityConfig['LOW'];

                      const typeLabels: Record<string, string> = {
                        'FAILED_LOGIN': 'Failed Login',
                        'BRUTE_FORCE_SUSPECTED': 'Brute Force Detected',
                        'ROLE_CHANGED': 'Role Changed',
                        'USER_DELETED': 'User Deleted',
                        'PERMISSION_VIOLATION': 'Permission Violation',
                        'SECURITY_EVENT': 'Security Event',
                        'SUSPICIOUS_ACTIVITY': 'Suspicious Activity',
                      };

                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className={`p-4 rounded-lg border-l-4 ${config.border} ${config.bg} transition-colors hover:shadow-sm`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-lg">{config.icon}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${config.badge} ${config.badgeText}`}>
                                  {alert.severity}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded-full text-gray-600">
                                  {typeLabels[alert.type] || alert.type}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mt-1">{alert.message}</p>
                              {alert.details && (
                                <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2 border border-gray-100">
                                  {alert.details.username && <span>User: <strong>{alert.details.username}</strong></span>}
                                  {alert.details.ip && <span className="ml-3">IP: {alert.details.ip}</span>}
                                  {alert.details.reason && <span className="ml-3">Reason: {alert.details.reason}</span>}
                                  {alert.details.attempts && <span className="ml-3">Attempts: {alert.details.attempts}</span>}
                                  {alert.details.previousRole && alert.details.newRole && (
                                    <span className="ml-3">Role: {alert.details.previousRole} → {alert.details.newRole}</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                                {alert.username && alert.username !== 'system' && (
                                  <span>By: {alert.username}</span>
                                )}
                                {alert.resolved && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                                    Resolved {alert.resolved_by ? `by ${alert.resolved_by}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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