import { useState, useEffect, useCallback } from "react";

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  lastLogin: string | null;
  activeSessions: number;
}

interface UseUsersOptions {
  search?: string;
  status?: "active" | "inactive";
  role?: string;
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.role) params.set("role", options.role);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user status");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive } : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  const updateUserRoles = useCallback(async (userId: string, roles: string[]) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roles }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user roles");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, roles } : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  const generateResetLink = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate reset link");
      }

      const data = await res.json();
      return data.resetLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    }
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUserStatus,
    updateUserRoles,
    generateResetLink,
  };
}
