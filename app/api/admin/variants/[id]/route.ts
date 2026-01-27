import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { BackorderPolicy } from "@prisma/client";
import { roundWhole } from "@/lib/pricing";

const parseWhole = (value: unknown) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }
  return roundWhole(numberValue);
};

export const GET = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const variant = await prisma.variant.findUnique({
    where: { id: context.params.id },
    include: { product: true, media: true },
  });

  if (!variant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: variant });
};

export const PATCH = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    sku: typeof body.sku === "string" ? body.sku.trim() : undefined,
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    size: typeof body.size === "string" ? body.size.trim() : undefined,
    color: typeof body.color === "string" ? body.color.trim() : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    backorderPolicy:
      body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
        ? body.backorderPolicy
        : undefined,
  };

  if (body.productId !== undefined) {
    data.productId = typeof body.productId === "string" ? body.productId : undefined;
  }

  if (body.priceEur !== undefined) {
    const priceEur = parseWhole(body.priceEur);
    if (priceEur === null) {
      return NextResponse.json({ error: "priceEur must be a number." }, { status: 400 });
    }
    data.priceEur = priceEur;
  }

  if (body.stock !== undefined) {
    if (!Number.isFinite(body.stock)) {
      return NextResponse.json({ error: "stock must be a number." }, { status: 400 });
    }
    data.stock = Math.trunc(body.stock);
  }

  const updated = await prisma.variant.update({
    where: { id: context.params.id },
    data,
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.variant.delete({ where: { id: context.params.id } });
  return NextResponse.json({ ok: true });
};

