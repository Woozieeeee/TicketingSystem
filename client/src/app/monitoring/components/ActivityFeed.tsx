"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Filter } from "lucide-react";
import type { ActivityLog, ActivityAction } from "../types/monitoring";

// ---------------------------------------------------------------------------
// Visual config per action type
// ---------------------------------------------------------------------------

interface ActionStyle {
  icon: string;
  color: string;
  bg: string;
}

const ACTION_STYLES: Record<string, ActionStyle> = {
  LOGIN_SUCCESS:        { icon: "🔑", color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  LOGOUT:               { icon: "🚪", color: "text-gray-700",    bg: "bg-gray-50 border-gray-200" },
  TICKET_CREATED:       { icon: "📝", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  TICKET_STATUS_CHANGED:{ icon: "🔄", color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  TICKET_UPDATED:       { icon: "✏️", color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200" },
  USER_REGISTERED:      { icon: "👤", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  USER_CREATED:         { icon: "➕", color: "text-teal-700",    bg: "bg-teal-50 border-teal-200" },
  USER_UPDATED:         { icon: "📋", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  USER_DELETED:         { icon: "🗑️", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  MONITORING_ACCESS:    { icon: "📊", color: "text-cyan-700",    bg: "bg-cyan-50 border-cyan-200" },
};

const DEFAULT_STYLE: ActionStyle = { icon: "📌", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL",                   label: "All Actions" },
  { value: "LOGIN_SUCCESS",         label: "Logins" },
  { value: "LOGOUT",                label: "Logouts" },
  { value: "TICKET_CREATED",        label: "Tickets Created" },
  { value: "TICKET_STATUS_CHANGED", label: "Status Changes" },
  { value: "TICKET_UPDATED",        label: "Ticket Updates" },
  { value: "USER_REGISTERED",       label: "Registrations" },
  { value: "USER_CREATED",          label: "Users Created" },
  { value: "USER_UPDATED",          label: "Users Updated" },
  { value: "USER_DELETED",          label: "Users Deleted" },
];

// ---------------------------------------------------------------------------
// Human-readable description builder
// ---------------------------------------------------------------------------

function describeActivity(act: ActivityLog): string {
  const d = act.details as Record<string, string | number | undefined>;

  switch (act.action) {
    case "LOGIN_SUCCESS":
      return `Logged in successfully (Login #${d?.loginCount ?? "?"})`;
    case "LOGOUT":
      return "Logged out of the system";
    case "TICKET_CREATED":
      return `Created ticket "${d?.title ?? "N/A"}" in ${d?.dept ?? "N/A"}`;
    case "TICKET_STATUS_CHANGED":
      return `Changed ticket status: ${d?.oldStatus ?? "?"} → ${d?.newStatus ?? "?"}`;
    case "TICKET_UPDATED":
      return `Updated ticket "${d?.title ?? "N/A"}"`;
    case "USER_REGISTERED":
      return `Registered as ${d?.role ?? "User"} in ${d?.dept ?? "N/A"}`;
    case "USER_CREATED":
      return `Created user "${d?.newUser ?? "N/A"}" (${d?.role ?? "User"})`;
    case "USER_UPDATED": {
      const roleChanged = d?.previousRole && d?.role && d.previousRole !== d.role;
      return `Updated user "${d?.targetUser ?? "N/A"}"${roleChanged ? ` (role: ${d.previousRole} → ${d.role})` : ""}`;
    }
    case "USER_DELETED":
      return `Deleted user "${d?.deletedUser ?? "N/A"}" (${d?.deletedRole ?? "N/A"})`;
    default:
      return `${act.action} — ${act.resource ?? "N/A"}`;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityFeedProps {
  activities: ActivityLog[];
  loading: boolean;
  onRefresh: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading, onRefresh }) => {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(
    () => (filter === "ALL" ? activities : activities.filter((a) => a.action === filter)),
    [activities, filter],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>

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

      {/* Body */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading activities…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-gray-700 font-medium mb-1">No Activities Yet</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Activities will appear here as users interact with the system.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filtered.map((act, i) => {
            const style = ACTION_STYLES[act.action] ?? DEFAULT_STYLE;

            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors hover:shadow-sm ${style.bg}`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{style.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${style.color}`}>
                      {act.username}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white/70 border border-gray-200 rounded-full text-gray-600">
                      {act.role ?? "N/A"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-0.5">{describeActivity(act)}</p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                    {act.ip_address && (
                      <span className="text-gray-400">IP: {act.ip_address}</span>
                    )}
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

export default ActivityFeed;
