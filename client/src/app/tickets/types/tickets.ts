export interface Ticket {
  globalId: string | number;
  id: number;
  title: string;
  description: string;
  category?: string;
  status: string;
  createdBy: string;
  dept: string;
  date: string;
  userMarkedDone?: boolean;
  headMarkedDone?: boolean;
  lastUpdated?: string;
  reminder_flag?: boolean;
  last_reminded_at?: string;
}

export interface SortConfig {
  key: keyof Ticket;
  direction: "asc" | "desc";
}

export interface User {
  id?: string;
  username?: string;
  role?: string;
  dept?: string;
}

export interface DeptAccent {
  color: string;
  bgTw: string;
  colorTw: string;
}
