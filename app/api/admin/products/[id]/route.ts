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

  const product = await prisma.product.findUnique({
    where: { id: context.params.id },
    include: { category: true, collection: true, variants: true, media: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
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
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    slug: typeof body.slug === "string" ? body.slug.trim() : undefined,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    type: typeof body.type === "string" ? body.type.trim() : undefined,
    gender: typeof body.gender === "string" ? body.gender.trim() : undefined,
    sport: typeof body.sport === "string" ? body.sport.trim() : undefined,
    categoryId: typeof body.categoryId === "string" ? body.categoryId : undefined,
    collectionId: typeof body.collectionId === "string" ? body.collectionId : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
    backorderPolicy:
      body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
        ? body.backorderPolicy
        : undefined,
  };

  if (body.basePriceEur !== undefined) {
    const basePriceEur = parseWhole(body.basePriceEur);
    if (basePriceEur === null) {
      return NextResponse.json({ error: "basePriceEur must be a number." }, { status: 400 });
    }
    data.basePriceEur = basePriceEur;
  }

  const updated = await prisma.product.update({
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

  await prisma.product.delete({ where: { id: context.params.id } });
  return NextResponse.json({ ok: true });
};

