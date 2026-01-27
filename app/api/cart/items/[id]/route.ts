import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

const resolveBackorderPolicy = (variant: any, product: any) => {
  return (
    variant?.backorderPolicy ||
    product?.backorderPolicy ||
    product?.collection?.backorderPolicy ||
    "DISALLOW"
  );
};

export const PATCH = async (request: Request, context: { params: { id: string } }) => {
  const body = await request.json().catch(() => null);
  const quantity = Number(body?.quantity ?? 0);

  if (!Number.isFinite(quantity)) {
    return NextResponse.json({ error: "quantity is required." }, { status: 400 });
  }

  const { cart } = await getOrCreateCart(request);
  const item = await prisma.cartItem.findUnique({
    where: { id: context.params.id },
    include: {
      variant: {
        include: { product: { include: { collection: true } } },
      },
    },
  });

  if (!item || item.cartId !== cart.id) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const updatedQty = Math.trunc(quantity);
  if (updatedQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  }

  const policy = resolveBackorderPolicy(item.variant, item.variant?.product);
  if (policy === "DISALLOW" && item.variant.stock < updatedQty) {
    return NextResponse.json({ error: "Insufficient stock." }, { status: 409 });
  }

  const unitPriceEur = item.variant.priceEur ?? item.variant.product.basePriceEur;

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: updatedQty, unitPriceEur },
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (request: Request, context: { params: { id: string } }) => {
  const { cart } = await getOrCreateCart(request);
  const item = await prisma.cartItem.findUnique({ where: { id: context.params.id } });

  if (!item || item.cartId !== cart.id) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
};

