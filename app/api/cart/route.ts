import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE, CART_TTL_SECONDS, getOrCreateCart } from "@/lib/cart";

export const GET = async (request: Request) => {
  const { cart, sessionId } = await getOrCreateCart(request);

  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  const response = NextResponse.json({ data: fullCart });
  if (sessionId) {
    response.cookies.set(CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CART_TTL_SECONDS,
    });
  }

  return response;
};

