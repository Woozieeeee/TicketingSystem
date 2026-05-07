'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from './types';
import { useUsers } from './hooks/useUsers';
import UserTabs from './components/UserTabs'
import UserTable from './components/UserTable';
import Pagination from './components/Pagination';
import AddUserModal from './components/AddUserModal';
import EditUserModal from './components/EditUserModal';

export default function UserManagementPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    searchQuery,
    activeTab,
    currentPage,
    rowsPerPage,
    filteredUsers,
    paginatedUsers,
    totalPages,
    tabCount,
    addUser,
    deleteUser,
    editUser,
    toggleStatus,
    handleTabChange,
    handleSearch,
    handleRowsPerPage,
    setCurrentPage,
    ROWS_OPTIONS,
  } = useUsers();

  return (
    <div className="min-h-screen p-6 bg-neutral-50/60 md:p-10">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              User Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm bg-white border rounded-lg border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 w-48"
              />
            </div>

            {/* Add User */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium text-white transition-colors rounded-lg bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950"
            >
              Add User
            </button>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white border border-neutral-200/60 rounded-xl shadow-sm overflow-hidden">
          <UserTabs
            activeTab={activeTab}
            tabCount={tabCount}
            onTabChange={handleTabChange}
          />
          <UserTable
            users={paginatedUsers}
            onToggleStatus={toggleStatus}
            onDelete={deleteUser}
            onEdit={(user) => setEditingUser(user)}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            rowsOptions={ROWS_OPTIONS}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={handleRowsPerPage}
          />
        </div>

        {/* Add User Modal */}
        {isModalOpen && (
          <AddUserModal
            onClose={() => setIsModalOpen(false)}
            onAdd={addUser}
          />
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={editUser}
          />
        )}

      </div>
    </div>
  );
}