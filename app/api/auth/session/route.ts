import { NextResponse } from "next/server";
import { getCookieValue, getSessionByToken, SESSION_COOKIE } from "@/lib/session";

export const GET = async (request: Request) => {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  const session = await getSessionByToken(token);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const roles = session.user.roles.map((entry) => entry.role.name);

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles,
    },
  });
};

