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

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, collection: true, variants: true, media: true },
  });

  return NextResponse.json({ data: products });
};

export const POST = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.slug !== "string") {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const basePriceEur = parseWhole(body.basePriceEur);
  if (basePriceEur === null) {
    return NextResponse.json({ error: "basePriceEur is required." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      type: typeof body.type === "string" ? body.type.trim() : undefined,
      gender: typeof body.gender === "string" ? body.gender.trim() : undefined,
      sport: typeof body.sport === "string" ? body.sport.trim() : undefined,
      categoryId: typeof body.categoryId === "string" ? body.categoryId : undefined,
      collectionId: typeof body.collectionId === "string" ? body.collectionId : undefined,
      basePriceEur,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
      backorderPolicy:
        body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
          ? body.backorderPolicy
          : undefined,
    },
  });

  return NextResponse.json({ data: product }, { status: 201 });
};

