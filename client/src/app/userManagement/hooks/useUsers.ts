import { useState, useEffect } from 'react';
import { API_URL } from '../../../config/api';
import { User, TabFilter } from '../types';

const ROWS_OPTIONS = [10, 20, 50];

type DbUser = {
  id: string;
  username: string;
  role: string;
  dept: string;
  login_count: number;
};

const normalizeRole = (role: string): User['role'] => {
  if (role === 'Admin' || role === 'Head') return 'Admin';
  if (role === 'Staff') return 'Staff';
  return 'User';
};

const buildEmail = (username: string) => {
  const normalized = username.trim().toLowerCase().replace(/\s+/g, '.');
  return normalized.includes('@') ? normalized : `${normalized}@ticketingsystem.local`;
};

const mapDbUserToUi = (dbUser: DbUser): User => ({
  id: dbUser.id,
  name: dbUser.username,
  email: buildEmail(dbUser.username),
  role: normalizeRole(dbUser.role),
  status: dbUser.login_count > 0 ? 'Active' : 'Pending',
  joinedDate: 'Unknown',
  dept: dbUser.dept,
  loginCount: dbUser.login_count,
});

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const reloadUsers = async () => {
    setLoading(true);
    setError(null);
  
    // FIX: Changed 'authToken' to 'token'
    const token = localStorage.getItem('token'); 

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      
      console.log(`Fetching users from: ${API_URL}/api/users, Status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('Users endpoint not found (404)');
          setUsers([]);
          setError('User endpoint not found (404). Please check the API URL.');
          return;
        }
        throw new Error(`Unable to load users (${response.status})`);
      }
      
      const data: DbUser[] = await response.json();
      setUsers(data.map(mapDbUserToUi));
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  const tabCount = (tab: TabFilter) => {
    if (tab === 'All') return users.length;
    if (tab === 'Suspended') return users.filter((u) => u.status === 'Suspended').length;
    return users.filter((u) => u.role === tab).length;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Suspended' ? user.status === 'Suspended' : user.role === activeTab);
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const addUser = async (name: string, email: string, role: User['role']) => {
    try {
      const token = localStorage.getItem('token'); // FIX: Use 'token'
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: name,
          password: 'ChangeMe123!',
          role,
          dept: 'General',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to create user');
      }

      const body = await response.json();
      const newUser: User = {
        id: body.userId,
        name,
        email,
        role,
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        dept: 'General',
        loginCount: 0,
      };
      setUsers((prev) => [newUser, ...prev]);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem('token'); // FIX: Use 'token'
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus: User['status'] = currentStatus === 'Active' ? 'Suspended' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    );
  };

  const editUser = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem('token'); // FIX: Use 'token'
      const response = await fetch(`${API_URL}/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: updatedUser.name,
          role: updatedUser.role,
          dept: updatedUser.dept ?? 'General',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to update user');
      }

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    } catch (error) {
      console.error('Failed to edit user:', error);
    }
  };

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleRowsPerPage = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  return {
    users,
    searchQuery,
    activeTab,
    currentPage,
    rowsPerPage,
    filteredUsers,
    paginatedUsers,
    totalPages,
    tabCount,
    error,
    loading,
    addUser,
    deleteUser,
    editUser,
    toggleStatus,
    handleTabChange,
    handleSearch,
    handleRowsPerPage,
    setCurrentPage,
    ROWS_OPTIONS,
  };
}