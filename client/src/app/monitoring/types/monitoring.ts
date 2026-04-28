// --- Core Types ---

/**
 * Representasyon ng bawat IT personnel sa system.
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
}

/**
 * Structure para sa bilang ng mga tickets base sa status.
 */
export interface TicketStats {
  pending: number;
  ongoing: number;
  resolved: number;
}

/**
 * Ang mga posibleng view states ng dashboard.
 */
export type DashboardView = "list" | "stats";

/**
 * Ang mga valid time ranges para sa analytics filtering.
 */
export type TimeRange = "Today" | "Weekly" | "Monthly";