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

export const GET = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const variants = await prisma.variant.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true, media: true },
  });

  return NextResponse.json({ data: variants });
};

export const POST = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.productId !== "string" || typeof body.sku !== "string") {
    return NextResponse.json({ error: "productId and sku are required." }, { status: 400 });
  }

  const priceEur = body.priceEur !== undefined ? parseWhole(body.priceEur) : null;
  if (body.priceEur !== undefined && priceEur === null) {
    return NextResponse.json({ error: "priceEur must be a number." }, { status: 400 });
  }

  const stock = Number.isFinite(body.stock) ? Math.trunc(body.stock) : 0;

  const variant = await prisma.variant.create({
    data: {
      productId: body.productId,
      sku: body.sku.trim(),
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      size: typeof body.size === "string" ? body.size.trim() : undefined,
      color: typeof body.color === "string" ? body.color.trim() : undefined,
      priceEur: priceEur ?? undefined,
      stock,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      backorderPolicy:
        body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
          ? body.backorderPolicy
          : undefined,
    },
  });

  return NextResponse.json({ data: variant }, { status: 201 });
};

