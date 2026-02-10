import { useState, useEffect } from "react";
import { RoleSelect } from "./RoleBadge";
import type { UserWithRoles } from "../hooks/useUsers";

interface UserFormProps {
  user: UserWithRoles | null;
  onClose: () => void;
  onSave: (userId: string, roles: string[]) => Promise<void>;
  onUserCreated: () => void;
}

export function UserForm({ user, onClose, onSave, onUserCreated }: UserFormProps) {
  const isEditing = !!user;

  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles || ["SUPPORT"]);
  const [sendInvite, setSendInvite] = useState(true);
  const [tempPassword, setTempPassword] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<UserWithRoles | null>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing) {
        // Update existing user roles
        await onSave(user.id, selectedRoles);
      } else {
        // Create new user
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || undefined,
            roles: selectedRoles,
            sendInvite,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create user");
        }

        setCreatedUser(data.user);
        if (data.tempPassword) {
          setTempPassword(data.tempPassword);
        }
        if (data.inviteLink) {
          setInviteLink(data.inviteLink);
        }
        onUserCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Success state after creating user
  if (createdUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bebas text-2xl text-white">User Created</h2>
            <p className="text-slate-400 mt-1">
              {createdUser.email} has been added with {createdUser.roles.join(", ")} role(s).
            </p>
          </div>

          {tempPassword && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <label className="block text-sm font-medium text-amber-400 mb-2">
                Temporary Password (copy now - shown once)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={tempPassword}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white font-mono"
                />
                <button
                  onClick={() => handleCopyToClipboard(tempPassword)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {inviteLink && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <label className="block text-sm font-medium text-blue-400 mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded text-white text-sm"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteLink)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Valid for 7 days. Share this link with the user to set their password.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-2xl text-white">
              {isEditing ? "Edit User" : "New User"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Email */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                placeholder="user@example.com"
              />
            </div>
          )}

          {/* Name */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                placeholder="Optional display name"
              />
            </div>
          )}

          {/* Roles */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Roles <span className="text-red-500">*</span>
            </label>
            <RoleSelect value={selectedRoles} onChange={setSelectedRoles} />
          </div>

          {/* Send Invite Option */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-800 text-gold focus:ring-gold focus:ring-offset-0"
                />
                <div>
                  <span className="font-medium text-white">Send invite link</span>
                  <p className="text-sm text-slate-400 mt-1">
                    Generate a password reset link that you can share with the user.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-white/10 text-white font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedRoles.length === 0}
              className="px-6 py-2 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditing ? "Saving..." : "Creating..."}
                </span>
              ) : (
                isEditing ? "Save Changes" : "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
