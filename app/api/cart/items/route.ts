import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE, CART_TTL_SECONDS, getOrCreateCart } from "@/lib/cart";

const resolveBackorderPolicy = (variant: any, product: any) => {
  return (
    variant?.backorderPolicy ||
    product?.backorderPolicy ||
    product?.collection?.backorderPolicy ||
    "DISALLOW"
  );
};

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  const quantity = Number(body?.quantity ?? 1);

  if (!variantId || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "variantId and quantity are required." }, { status: 400 });
  }

  const { cart, sessionId } = await getOrCreateCart(request);

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        include: {
          collection: true,
        },
      },
    },
  });

  if (!variant || !variant.product) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  const requested = Math.trunc(quantity);
  const unitPriceEur = variant.priceEur ?? variant.product.basePriceEur;

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: variant.id,
      },
    },
  });

  const newQuantity = (existing?.quantity || 0) + requested;
  const policy = resolveBackorderPolicy(variant, variant.product);

  if (policy === "DISALLOW" && variant.stock < newQuantity) {
    return NextResponse.json({ error: "Insufficient stock." }, { status: 409 });
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: variant.id,
      },
    },
    update: {
      quantity: newQuantity,
      unitPriceEur,
    },
    create: {
      cartId: cart.id,
      variantId: variant.id,
      quantity: newQuantity,
      unitPriceEur,
    },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  const response = NextResponse.json({ data: updatedCart });
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

