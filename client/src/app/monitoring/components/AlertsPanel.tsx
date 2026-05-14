"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Filter } from "lucide-react";
import type { SecurityAlert, AlertSeverity } from "../types/monitoring";

// ---------------------------------------------------------------------------
// Severity visual config
// ---------------------------------------------------------------------------

interface SeverityStyle {
  icon: string;
  border: string;
  bg: string;
  badge: string;
  badgeText: string;
  dot: string;
  light: string;
  text: string;
}

const SEVERITY_STYLES: Record<string, SeverityStyle> = {
  CRITICAL: {
    icon: "🔴", border: "border-red-300",    bg: "bg-red-50",
    badge: "bg-red-100",    badgeText: "text-red-800",
    dot: "bg-red-500",      light: "bg-red-50",    text: "text-red-700",
  },
  HIGH: {
    icon: "🟠", border: "border-orange-300", bg: "bg-orange-50",
    badge: "bg-orange-100", badgeText: "text-orange-800",
    dot: "bg-orange-500",   light: "bg-orange-50", text: "text-orange-700",
  },
  MEDIUM: {
    icon: "🟡", border: "border-yellow-300", bg: "bg-yellow-50",
    badge: "bg-yellow-100", badgeText: "text-yellow-800",
    dot: "bg-yellow-500",   light: "bg-yellow-50", text: "text-yellow-700",
  },
  LOW: {
    icon: "🔵", border: "border-blue-300",   bg: "bg-blue-50",
    badge: "bg-blue-100",   badgeText: "text-blue-800",
    dot: "bg-blue-500",     light: "bg-blue-50",   text: "text-blue-700",
  },
};

const TYPE_LABELS: Record<string, string> = {
  FAILED_LOGIN:          "Failed Login",
  BRUTE_FORCE_SUSPECTED: "Brute Force Detected",
  ROLE_CHANGED:          "Role Changed",
  USER_DELETED:          "User Deleted",
  PERMISSION_VIOLATION:  "Permission Violation",
  SUSPICIOUS_ACTIVITY:   "Suspicious Activity",
  SECURITY_EVENT:        "Security Event",
};

const SEVERITY_ORDER: AlertSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL",      label: "All Severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH",     label: "High" },
  { value: "MEDIUM",   label: "Medium" },
  { value: "LOW",      label: "Low" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AlertsPanelProps {
  alerts: SecurityAlert[];
  loading: boolean;
  onRefresh: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, loading, onRefresh }) => {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(
    () => (filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter)),
    [alerts, filter],
  );

  /** Counts per severity for summary cards. */
  const countBySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of SEVERITY_ORDER) map[s] = 0;
    for (const a of alerts) map[a.severity] = (map[a.severity] ?? 0) + 1;
    return map;
  }, [alerts]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 active:scale-95 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards — always visible when there are alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SEVERITY_ORDER.map((sev) => {
            const s = SEVERITY_STYLES[sev];
            return (
              <div key={sev} className={`${s.light} rounded-lg p-3 border border-gray-100`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-xs font-medium text-gray-500">{sev}</span>
                </div>
                <span className={`text-2xl font-bold ${s.text}`}>{countBySeverity[sev]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading alerts…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <h4 className="text-gray-700 font-medium mb-1">All Clear</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            No security alerts at this time. The system is operating normally.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
          {filtered.map((alert, i) => {
            const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.LOW;
            const details = alert.details as Record<string, string | number | undefined>;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                className={`p-4 rounded-lg border-l-4 ${style.border} ${style.bg} transition-colors hover:shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-lg">{style.icon}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${style.badge} ${style.badgeText}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded-full text-gray-600">
                        {TYPE_LABELS[alert.type] ?? alert.type}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm font-medium text-gray-900 mt-1">{alert.message}</p>

                    {/* Detail chips */}
                    {details && Object.keys(details).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 bg-white/50 rounded p-2 border border-gray-100">
                        {details.username && (
                          <span>
                            User: <strong>{String(details.username)}</strong>
                          </span>
                        )}
                        {details.ip && <span>IP: {String(details.ip)}</span>}
                        {details.reason && <span>Reason: {String(details.reason)}</span>}
                        {details.attempts != null && (
                          <span>Attempts: {String(details.attempts)}</span>
                        )}
                        {details.previousRole && details.newRole && (
                          <span>
                            Role: {String(details.previousRole)} → {String(details.newRole)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                      {alert.username && alert.username !== "system" && (
                        <span>By: {alert.username}</span>
                      )}
                      {alert.resolved && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                          Resolved{alert.resolved_by ? ` by ${alert.resolved_by}` : ""}
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
  );
};

export default AlertsPanel;
