import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { BackorderPolicy } from "@prisma/client";
import { roundWhole } from "@/lib/pricing";
import { getPublicObjectUrl } from "@/lib/s3";
import { logProductCreated } from "@/lib/audit";

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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const collectionId = searchParams.get("collectionId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    const searchLower = search.toLowerCase();
    where.OR = [
      { name: { contains: searchLower, mode: "insensitive" } },
      { slug: { contains: searchLower, mode: "insensitive" } },
      { description: { contains: searchLower, mode: "insensitive" } },
    ];
  }

  if (status) {
    switch (status) {
      case "active":
        where.isActive = true;
        break;
      case "inactive":
        where.isActive = false;
        break;
      case "featured":
        where.isFeatured = true;
        break;
    }
  }

  if (collectionId) {
    where.collectionId = collectionId;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        category: true,
        collection: true,
        variants: true,
        media: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.product.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    }),
  ]);

  const withUrls = products.map((product) => ({
    ...product,
    media: product.media.map((item) => ({
      ...item,
      url: getPublicObjectUrl(item.bucket, item.objectKey),
    })),
  }));

  return NextResponse.json({
    data: withUrls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
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

  // Log product creation
  await logProductCreated(
    session.userId,
    product.id,
    product.name,
    request
  );

  return NextResponse.json({ data: product }, { status: 201 });
};

