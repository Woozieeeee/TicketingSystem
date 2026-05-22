import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { User, TabFilter } from '../types';
// 🟢 Inactivate ang authFetch para siyang awtomatikong mag-asikaso ng Bearer Token at Cookies niyo
import { authFetch } from '../../../lib/apiClient';

const ROWS_OPTIONS = [10, 20, 50];

type DbUser = {
  id: string;
  username?: string; // Flexible parameter checks para sa query runtime parity
  name?: string;     
  email?: string;    
  role: string;
  dept: string;
  login_count: number;
  status?: string;
};

const normalizeRole = (role: string): User['role'] => {
  if (role === 'Head') return 'Head';
  if (role === 'Admin') return 'Admin';
  return 'User';
};

const normalizeStatus = (dbUser: DbUser): User['status'] => {
  if (dbUser.status === 'Suspended') return 'Suspended';
  if (dbUser.status === 'Active') return 'Active'; // 🟢 UPDATE NG CO-WORKER: Explicit active schema status check
  return dbUser.login_count > 0 ? 'Active' : 'Pending';
};

const buildEmail = (username: string | null | undefined) => {
  // 🟢 SAFETY GUARD: Kung walang username, mag-fallback sa temporary email imbis na mag-crash
  if (!username) {
    return 'unknown.user@ticketingsystem.local';
  }

  const normalized = username.trim().toLowerCase().replace(/\s+/g, '.');
  return normalized.includes('@') ? normalized : `${normalized}@ticketingsystem.local`;
};

const mapDbUserToUi = (dbUser: DbUser): User => ({
  id: dbUser.id,
  name: dbUser.username || dbUser.name || 'Unknown User',
  // Isasapuso ang totoong email mula sa DB kung meron, kung wala gagamit ng custom resolver transformation
  email: dbUser.email || buildEmail(dbUser.username || dbUser.name),
  role: normalizeRole(dbUser.role),
  status: normalizeStatus(dbUser),
  joinedDate: 'Unknown',
  dept: dbUser.dept || 'General',
  loginCount: dbUser.login_count || 0,
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

    try {
      // 🟢 FIX: Pinalitan ng authFetch para kusang magpadala ng Authorization Token Headers
      const response = await authFetch('/api/users');

      if (!response.ok) {
        if (response.status === 404) {
          setUsers([]);
          setError('User endpoint not found (404). Please check the API URL.');
          return;
        }
        if (response.status === 403) {
          setUsers([]);
          setError('Access denied. User management is restricted to IT Department Head only.');
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

  // 🟢 UPDATE NG CO-WORKER: May kasama nang Filter sorting matching configuration
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Suspended' ? user.status === 'Suspended' : user.role === activeTab);
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    // Inaayos ang hierarchy: Head (Una) -> Admin (Pangalawa) -> User (Huli)
    const roleOrder: Record<User['role'], number> = { Head: 0, Admin: 1, User: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const addUser = async (name: string, email: string, role: User['role'], dept: string) => {
    try {
      // 🟢 FIX: Ngayong may email column na ang DB natin, ipasa na rin natin ito sa backend registration payload
      const response = await authFetch('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({
          username: name,
          email: email, // 👈 Idinagdag para ma-save ang email field sa MySQL table record
          password: 'ChangeMe123!',
          role,
          dept,
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
        status: 'Pending',
        joinedDate: new Date().toISOString().split('T')[0],
        dept,
        loginCount: 0,
      };
      setUsers((prev) => [newUser, ...prev]);
      setCurrentPage(1);

      Swal.fire({ icon: 'success', title: 'User Created', text: `${name} has been added successfully.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error('Failed to add user:', err);
      Swal.fire({ icon: 'error', title: 'Failed to Create User', text: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${target?.name || 'this user'}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      // 🟢 FIX: Pinalitan ng authFetch para sa DELETE action
      const response = await authFetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted', text: `${target?.name || 'User'} has been deleted.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error('Failed to delete user:', err);
      Swal.fire({ icon: 'error', title: 'Failed to Delete', text: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const target = users.find((u) => u.id === id);
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const action = newStatus === 'Suspended' ? 'suspend' : 'activate';

    const result = await Swal.fire({
      title: `${newStatus === 'Suspended' ? 'Suspend' : 'Activate'} User?`,
      text: `Are you sure you want to ${action} ${target?.name || 'this user'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'Suspended' ? '#dc2626' : '#059669',
      confirmButtonText: newStatus === 'Suspended' ? 'Suspend' : 'Activate',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      // 🟢 FIX: Pinalitan ng authFetch para sa PUT state change ng status toggle
      const response = await authFetch(`/api/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || `Failed to ${action} user`);
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus as User['status'] } : u)),
      );

      Swal.fire({ icon: 'success', title: newStatus === 'Suspended' ? 'Suspended' : 'Activated', text: `${target?.name || 'User'} has been ${action}d.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      Swal.fire({ icon: 'error', title: `Failed to ${action}`, text: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const editUser = async (updatedUser: User, newPassword?: string) => {
    try {
      const payload: any = {
        username: updatedUser.name,
        email: updatedUser.email, // 🟢 Sinisigurong kasama ang email sa update synchronization payload
        role: updatedUser.role,
        dept: updatedUser.dept ?? 'General',
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      // 🟢 FIX: Pinalitan ng authFetch para sa profile information modification
      const response = await authFetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to update user');
      }

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

      const successMsg = newPassword
        ? `${updatedUser.name} has been updated with a new password.`
        : `${updatedUser.name} has been updated.`;
      Swal.fire({ icon: 'success', title: 'User Updated', text: successMsg, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error('Failed to edit user:', err);
      Swal.fire({ icon: 'error', title: 'Failed to Update', text: err instanceof Error ? err.message : 'Unknown error' });
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