import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createSession, getRequestIp, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

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

