import { User } from '../types';

interface UserTableProps {
  users: User[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onEdit: (user: User) => void;
}

const roleColor = (role: User['role']) => {
  if (role === 'Admin') return 'bg-neutral-100 text-neutral-800';
  if (role === 'Staff') return 'bg-blue-50 text-blue-700';
  return 'bg-green-50 text-green-700';
};

const statusColor = (status: User['status']) => {
  if (status === 'Active') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Pending') return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
};

export default function UserTable({ users, onToggleStatus, onDelete, onEdit }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base text-left">
        <thead className="text-sm font-medium tracking-wider uppercase text-neutral-400 border-b border-neutral-100">
          <tr>
            <th className="px-8 py-4">Name</th>
            <th className="px-8 py-4">Email</th>
            <th className="px-8 py-4">Role</th>
            <th className="px-8 py-4">Status</th>
            <th className="px-8 py-4">Joined</th>
            <th className="px-8 py-4 text-right">Opt.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-8 py-5 font-medium text-neutral-900">{user.name}</td>
                <td className="px-8 py-5 text-neutral-500">{user.email}</td>
                <td className="px-8 py-5">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${roleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-neutral-400">{user.joinedDate}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleStatus(user.id, user.status)}
                      className={`text-sm font-medium transition-colors ${
                        user.status === 'Active'
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-8 py-20 text-center text-neutral-400">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}