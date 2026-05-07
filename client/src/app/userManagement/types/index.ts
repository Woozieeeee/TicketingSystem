export type TabFilter = 'All' | 'Admin' | 'Staff' | 'User' | 'Suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'User';
  status: 'Active' | 'Pending' | 'Suspended';
  joinedDate: string;
  dept?: string;
  loginCount?: number;
}