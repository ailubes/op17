import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSession, getRequestIp, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSession({
    userId: user.id,
    ip: getRequestIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });

  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    expires: session.expiresAt,
  });

  return response;
};

