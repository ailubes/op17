import {
  Permission,
  RoleName,
  userHasPermission,
  canManageUsers as checkCanManageUsers,
  canViewAuditLogs as checkCanViewAuditLogs,
} from "@/lib/permissions";
import { getCookieValue, getSessionByToken, SESSION_COOKIE } from "@/lib/session";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER", "FULFILLMENT", "SUPPORT"]);

export const requireSession = async (request: Request) => {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  return getSessionByToken(token);
};

export const requireAdminSession = async (request: Request) => {
  const session = await requireSession(request);
  if (!session) {
    return null;
  }

  const roles = session.user.roles.map((entry) => entry.role.name);
  const hasRole = roles.some((role) => ADMIN_ROLES.has(role));
  return hasRole ? session : null;
};

/**
 * Require a specific permission for the current user
 * Returns null if user doesn't have permission
 */
export const requirePermission = async (
  request: Request,
  permission: Permission
) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return null;
  }

  const hasPermission = userHasPermission(
    session.user.roles as { role: { name: RoleName } }[],
    permission
  );
  return hasPermission ? session : null;
};

/**
 * Require user management permission (ADMIN only)
 */
export const requireUserManagement = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return null;
  }

  const canManage = checkCanManageUsers(
    session.user.roles as { role: { name: RoleName } }[]
  );
  return canManage ? session : null;
};

/**
 * Require audit log viewing permission (ADMIN only)
 */
export const requireAuditAccess = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return null;
  }

  const canView = checkCanViewAuditLogs(
    session.user.roles as { role: { name: RoleName } }[]
  );
  return canView ? session : null;
};

/**
 * Check if user can perform an action on a specific resource
 * Returns 403 response if not allowed, null if allowed
 */
export const checkPermission = async (
  request: Request,
  permission: Permission
): Promise<
  | {
      error: Response;
      session: null;
    }
  | {
      error: null;
      session: Awaited<ReturnType<typeof requireAdminSession>>;
    }
> => {
  const session = await requirePermission(request, permission);

  if (!session) {
    // Check if they have an admin session at all
    const adminSession = await requireAdminSession(request);
    if (!adminSession) {
      return {
        error: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
        session: null,
      };
    }

    return {
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
      session: null,
    };
  }

  return { error: null, session };
};

/**
 * Helper to create unauthorized response
 */
export const unauthorizedResponse = () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper to create forbidden response
 */
export const forbiddenResponse = () =>
  new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper to create not found response
 */
export const notFoundResponse = (resource = "Resource") =>
  new Response(JSON.stringify({ error: `${resource} not found` }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper to create bad request response
 */
export const badRequestResponse = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper to create JSON response
 */
export const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });


