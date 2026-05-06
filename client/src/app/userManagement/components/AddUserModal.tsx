import { useState } from 'react';
import { User } from '../types';

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (name: string, email: string, role: User['role']) => void;
}

export default function AddUserModal({ onClose, onAdd }: AddUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<User['role']>('User');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name, email, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/20 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white border shadow-lg rounded-xl border-neutral-200">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Add New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
              placeholder="First Last"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User['role'])}
              className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
            >
              <option value="User">User</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium border rounded-lg border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-neutral-900 hover:bg-neutral-800"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}