import { NextResponse } from "next/server";
import { deleteSessionByToken, getCookieValue, SESSION_COOKIE } from "@/lib/session";

export const POST = async (request: Request) => {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  await deleteSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
};

