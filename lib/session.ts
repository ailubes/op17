import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "op17_session";
export const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createSession = async (payload: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) => {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId: payload.userId,
      token: tokenHash,
      expiresAt,
      ip: payload.ip ?? undefined,
      userAgent: payload.userAgent ?? undefined,
    },
  });

  return { token, expiresAt };
};

export const getSessionByToken = async (token?: string | null) => {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { token: tokenHash },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
};

export const deleteSessionByToken = async (token?: string | null) => {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { token: tokenHash } });
};

export const getCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
};

export const getRequestIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return request.headers.get("x-real-ip");
};

