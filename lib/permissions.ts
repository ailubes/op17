/**
 * Role-based permission system for admin users
 */

export type RoleName = "ADMIN" | "MANAGER" | "FULFILLMENT" | "SUPPORT" | "CUSTOMER";

export type Permission =
  // User management (ADMIN only)
  | "users:manage"
  | "users:view"
  // Audit logs (ADMIN only)
  | "audit:view"
  // Products
  | "products:create"
  | "products:update"
  | "products:delete"
  | "products:view"
  // Variants
  | "variants:create"
  | "variants:update"
  | "variants:delete"
  | "variants:view"
  // Collections
  | "collections:create"
  | "collections:update"
  | "collections:delete"
  | "collections:view"
  // Categories
  | "categories:create"
  | "categories:update"
  | "categories:delete"
  | "categories:view"
  // Promo codes
  | "promo-codes:create"
  | "promo-codes:update"
  | "promo-codes:delete"
  | "promo-codes:view"
  // Orders
  | "orders:view"
  | "orders:update-status"
  | "orders:add-tracking"
  | "orders:add-notes"
  | "orders:full"
  // Refunds
  | "refunds:create"
  | "refunds:update";

/**
 * Permission matrix by role
 */
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMIN: [
    // User management
    "users:manage",
    "users:view",
    // Audit logs
    "audit:view",
    // Products (full access)
    "products:create",
    "products:update",
    "products:delete",
    "products:view",
    // Variants (full access)
    "variants:create",
    "variants:update",
    "variants:delete",
    "variants:view",
    // Collections (full access)
    "collections:create",
    "collections:update",
    "collections:delete",
    "collections:view",
    // Categories (full access)
    "categories:create",
    "categories:update",
    "categories:delete",
    "categories:view",
    // Promo codes (full access)
    "promo-codes:create",
    "promo-codes:update",
    "promo-codes:delete",
    "promo-codes:view",
    // Orders (full access)
    "orders:view",
    "orders:update-status",
    "orders:add-tracking",
    "orders:add-notes",
    "orders:full",
    // Refunds (full access)
    "refunds:create",
    "refunds:update",
  ],
  MANAGER: [
    // Users (view only)
    "users:view",
    // Products (full access)
    "products:create",
    "products:update",
    "products:delete",
    "products:view",
    // Variants (full access)
    "variants:create",
    "variants:update",
    "variants:delete",
    "variants:view",
    // Collections (full access)
    "collections:create",
    "collections:update",
    "collections:delete",
    "collections:view",
    // Categories (full access)
    "categories:create",
    "categories:update",
    "categories:delete",
    "categories:view",
    // Promo codes (full access)
    "promo-codes:create",
    "promo-codes:update",
    "promo-codes:delete",
    "promo-codes:view",
    // Orders (view and update)
    "orders:view",
    "orders:update-status",
    "orders:add-tracking",
    "orders:add-notes",
    // Refunds (full access)
    "refunds:create",
    "refunds:update",
  ],
  FULFILLMENT: [
    // Products (view only)
    "products:view",
    // Variants (view and update stock)
    "variants:view",
    "variants:update", // For stock updates
    // Collections (view only)
    "collections:view",
    // Categories (view only)
    "categories:view",
    // Orders (view and fulfillment actions)
    "orders:view",
    "orders:update-status",
    "orders:add-tracking",
    "orders:add-notes",
  ],
  SUPPORT: [
    // Products (view only)
    "products:view",
    // Variants (view only)
    "variants:view",
    // Collections (view only)
    "collections:view",
    // Categories (view only)
    "categories:view",
    // Orders (view and add notes)
    "orders:view",
    "orders:add-notes",
  ],
  CUSTOMER: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if any of the user's roles has a specific permission
 */
export function userHasPermission(
  userRoles: { role: { name: RoleName } }[],
  permission: Permission
): boolean {
  return userRoles.some((userRole) =>
    hasPermission(userRole.role.name, permission)
  );
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(
  userRoles: { role: { name: RoleName } }[],
  permissions: Permission[]
): boolean {
  return permissions.some((permission) =>
    userHasPermission(userRoles, permission)
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(
  userRoles: { role: { name: RoleName } }[],
  permissions: Permission[]
): boolean {
  return permissions.every((permission) =>
    userHasPermission(userRoles, permission)
  );
}

/**
 * Get all permissions for a user based on their roles
 */
export function getUserPermissions(
  userRoles: { role: { name: RoleName } }[]
): Permission[] {
  const permissions = new Set<Permission>();
  for (const userRole of userRoles) {
    for (const permission of ROLE_PERMISSIONS[userRole.role.name] ?? []) {
      permissions.add(permission);
    }
  }
  return Array.from(permissions);
}

/**
 * Check if user can manage other users (ADMIN only)
 */
export function canManageUsers(
  userRoles: { role: { name: RoleName } }[]
): boolean {
  return userHasPermission(userRoles, "users:manage");
}

/**
 * Check if user can view audit logs (ADMIN only)
 */
export function canViewAuditLogs(
  userRoles: { role: { name: RoleName } }[]
): boolean {
  return userHasPermission(userRoles, "audit:view");
}

/**
 * Check if user is ADMIN
 */
export function isAdmin(userRoles: { role: { name: RoleName } }[]): boolean {
  return userRoles.some((userRole) => userRole.role.name === "ADMIN");
}

/**
 * Get the highest role in the hierarchy
 */
export function getPrimaryRole(
  userRoles: { role: { name: RoleName } }[]
): RoleName | null {
  const hierarchy: RoleName[] = [
    "ADMIN",
    "MANAGER",
    "FULFILLMENT",
    "SUPPORT",
    "CUSTOMER",
  ];
  for (const role of hierarchy) {
    if (userRoles.some((ur) => ur.role.name === role)) {
      return role;
    }
  }
  return null;
}

/**
 * Role display configuration
 */
export const ROLE_CONFIG: Record<
  RoleName,
  { label: string; color: string; description: string }
> = {
  ADMIN: {
    label: "Admin",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    description: "Full access to all features",
  },
  MANAGER: {
    label: "Manager",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    description: "Can manage products, orders, and content",
  },
  FULFILLMENT: {
    label: "Fulfillment",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    description: "Can manage orders and inventory",
  },
  SUPPORT: {
    label: "Support",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    description: "Can view orders and add notes",
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    description: "Regular customer account",
  },
};
