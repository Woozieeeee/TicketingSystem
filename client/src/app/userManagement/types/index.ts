export type TabFilter = 'All' | 'Head' | 'Admin' | 'User' | 'Suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Head' | 'Admin' | 'User';
  status: 'Active' | 'Pending' | 'Suspended';
  joinedDate: string;
  dept?: string;
  loginCount?: number;
}