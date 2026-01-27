import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCookieValue } from "@/lib/session";
import { requireSession } from "@/lib/guards";

export const CART_COOKIE = "op17_cart";
export const CART_TTL_DAYS = 14;
export const CART_TTL_SECONDS = CART_TTL_DAYS * 24 * 60 * 60;

export const createCartSessionId = () => randomBytes(16).toString("hex");

export const getOrCreateCart = async (request: Request) => {
  const session = await requireSession(request);
  if (session?.userId) {
    const existing = await prisma.cart.findFirst({ where: { userId: session.userId } });
    if (existing) {
      return { cart: existing, sessionId: null };
    }

    const cart = await prisma.cart.create({ data: { userId: session.userId } });
    return { cart, sessionId: null };
  }

  const cookie = getCookieValue(request.headers.get("cookie"), CART_COOKIE);
  if (cookie) {
    const existing = await prisma.cart.findFirst({ where: { sessionId: cookie } });
    if (existing) {
      return { cart: existing, sessionId: null };
    }
  }

  const sessionId = createCartSessionId();
  const cart = await prisma.cart.create({ data: { sessionId } });
  return { cart, sessionId };
};

