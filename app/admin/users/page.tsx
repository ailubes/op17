"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FilterBar, EntityCard, ActionButton } from "@/components/admin";
import { RoleBadge } from "./components/RoleBadge";
import { UserForm } from "./components/UserForm";
import { useUsers, type UserWithRoles } from "./hooks/useUsers";

const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const roleFilters = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "FULFILLMENT", label: "Fulfillment" },
  { value: "SUPPORT", label: "Support" },
];

export default function UsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);

  const { users, loading, error, refetch, updateUserStatus, updateUserRoles } = useUsers({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    role: roleFilter === "all" ? undefined : roleFilter,
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        const hasAdminRole = data.user?.roles?.some((r: string) => r === "ADMIN");
        setIsAdmin(hasAdminRole);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  const handleDeactivate = useCallback(
    async (userId: string) => {
      if (!confirm("Are you sure you want to deactivate this user? They will be logged out immediately.")) {
        return;
      }
      await updateUserStatus(userId, false);
    },
    [updateUserStatus]
  );

  const handleActivate = useCallback(
    async (userId: string) => {
      await updateUserStatus(userId, true);
    },
    [updateUserStatus]
  );

  const handleEditRoles = useCallback((user: UserWithRoles) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingUser(null);
  }, []);

  const handleSaveRoles = useCallback(
    async (userId: string, roles: string[]) => {
      await updateUserRoles(userId, roles);
      handleCloseForm();
    },
    [updateUserRoles, handleCloseForm]
  );

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="font-bebas text-3xl mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">Only administrators can access user management.</p>
        <Link
          href="/admin"
          className="inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white transition-colors"
        >
          Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl sm:text-5xl">Users</h1>
          <p className="text-slate-400 mt-1">Manage admin users and their roles</p>
        </div>
        <ActionButton
          onClick={() => setIsFormOpen(true)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New User
        </ActionButton>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or name..."
        filters={[
          {
            value: statusFilter,
            options: tabs.map((t) => ({ value: t.value, label: t.label })),
            onChange: (value: string) => setStatusFilter(value as "all" | "active" | "inactive"),
          },
        ]}
        actions={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-gold"
          >
            {roleFilters.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        }
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      )}

      {/* Users List */}
      {!loading && !error && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {search ? "No users match your search" : "No users found"}
            </div>
          ) : (
            users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
                onEditRoles={handleEditRoles}
              />
            ))
          )}
        </div>
      )}

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          user={editingUser}
          onClose={handleCloseForm}
          onSave={handleSaveRoles}
          onUserCreated={refetch}
        />
      )}
    </div>
  );
}

interface UserCardProps {
  user: UserWithRoles;
  onDeactivate: (userId: string) => void;
  onActivate: (userId: string) => void;
  onEditRoles: (user: UserWithRoles) => void;
}

function UserCard({ user, onDeactivate, onActivate, onEditRoles }: UserCardProps) {
  const formattedDate = user.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <EntityCard
      title={user.email}
      subtitle={user.name || undefined}
      badges={!user.isActive ? [{ label: "Inactive", variant: "error" }] : undefined}
      meta={
        <div className="flex flex-wrap items-center gap-2">
          {user.roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {formattedDate ? (
              <>Last login: {formattedDate}</>
            ) : (
              <span className="italic">Never logged in</span>
            )}
          </span>
          {user.activeSessions > 0 && (
            <span className="text-green-500">{user.activeSessions} active session(s)</span>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditRoles(user)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Edit roles"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {user.isActive ? (
            <button
              onClick={() => onDeactivate(user.id)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Deactivate"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onActivate(user.id)}
              className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
              title="Activate"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      }
    />
  );
}
