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

