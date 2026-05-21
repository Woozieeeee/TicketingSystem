// ---------------------------------------------------------------------------
// Core domain types for the Monitoring dashboard
// ---------------------------------------------------------------------------

/** Representasyon ng bawat IT personnel sa system. */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
  dept?: string;
  totalTickets?: number;
  pendingTickets?: number;
  ongoingTickets?: number;
  resolvedTickets?: number;
  loginCount?: number;
  createdAt?: string;
}

/** Ticket count breakdown by status. */
export interface TicketStats {
  pending: number;
  ongoing: number;
  resolved: number;
}

/** View states of the monitoring dashboard. */
export type DashboardView = "list" | "stats" | "activities" | "alerts";

/** Time-range options for analytics filters. */
export type TimeRange = "Today" | "Weekly" | "Monthly";

// ---------------------------------------------------------------------------
// Activity log types
// ---------------------------------------------------------------------------

export type ActivityAction =
  | "LOGIN_SUCCESS"
  | "LOGOUT"
  | "USER_REGISTERED"
  | "TICKET_CREATED"
  | "TICKET_UPDATED"
  | "TICKET_STATUS_CHANGED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "MONITORING_ACCESS";

export interface ActivityLog {
  id: number;
  username: string;
  action: ActivityAction;
  resource: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  role: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Security alert types
// ---------------------------------------------------------------------------

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type AlertType =
  | "FAILED_LOGIN"
  | "BRUTE_FORCE_SUSPECTED"
  | "ROLE_CHANGED"
  | "USER_DELETED"
  | "PERMISSION_VIOLATION"
  | "SUSPICIOUS_ACTIVITY"
  | "SECURITY_EVENT";

export interface SecurityAlert {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, unknown>;
  username: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}