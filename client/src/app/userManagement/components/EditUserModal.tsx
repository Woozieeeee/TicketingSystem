import { useState, useEffect } from 'react';
import { User } from '../types';
import { API_URL } from '../../../config/api';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User, newPassword?: string) => void;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<User['role']>(user.role);
  const [dept, setDept] = useState(user.dept || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const users = await res.json();
          const depts = [...new Set(users.map((u: any) => u.dept).filter(Boolean))] as string[];
          depts.sort();
          setDepartments(depts);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword) {
      const errors: string[] = [];
      if (newPassword.length < 8) errors.push('at least 8 characters');
      if (!/[A-Z]/.test(newPassword)) errors.push('one uppercase letter');
      if (!/[a-z]/.test(newPassword)) errors.push('one lowercase letter');
      if (!/[0-9]/.test(newPassword)) errors.push('one number');
      if (errors.length > 0) {
        setPasswordError(`Password needs: ${errors.join(', ')}`);
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    onSave(
      { ...user, name, email, role, dept: dept.trim().toUpperCase() || user.dept },
      newPassword || undefined,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/20 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white border shadow-lg rounded-xl border-neutral-200">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Edit User</h2>
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
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              {dept && !departments.includes(dept) && (
                <option value={dept}>{dept}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User['role'])}
              className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
            >
              <option value="User">User</option>
              <option value="Head">Head (Department Head)</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <label className="block mb-1 text-xs font-medium uppercase text-neutral-400">
              Change Password <span className="normal-case text-neutral-300">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                className="w-full px-3 py-2 pr-16 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
                placeholder="New password"
                minLength={6}
              />
              {newPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-xs font-medium -translate-y-1/2 right-3 top-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            {newPassword && (
              <div className="mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-neutral-200 focus:border-neutral-400 focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            )}
            {passwordError && (
              <p className="mt-1 text-xs text-red-500">{passwordError}</p>
            )}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}