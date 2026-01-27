import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { BackorderPolicy, CollectionStatus, SaleMode } from "@prisma/client";

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ensureSingleLiveDrop = async (excludeId?: string) => {
  const existing = await prisma.collection.findFirst({
    where: {
      status: CollectionStatus.LIVE,
      saleMode: SaleMode.DROP,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (existing) {
    return false;
  }

  return true;
};

export const GET = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    orderBy: { createdAt: "desc" },
    include: { products: true },
  });

  return NextResponse.json({ data: collections });
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

  const status = body.status ?? CollectionStatus.UPCOMING;
  const saleMode = body.saleMode ?? SaleMode.DROP;

  if (status === CollectionStatus.LIVE && saleMode === SaleMode.DROP) {
    const ok = await ensureSingleLiveDrop();
    if (!ok) {
      return NextResponse.json({ error: "Another LIVE drop already exists." }, { status: 409 });
    }
  }

  const startsAt = parseDate(body.startsAt);
  const endsAt = parseDate(body.endsAt);
  if (body.startsAt && !startsAt) {
    return NextResponse.json({ error: "Invalid startsAt." }, { status: 400 });
  }
  if (body.endsAt && !endsAt) {
    return NextResponse.json({ error: "Invalid endsAt." }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      status,
      saleMode,
      startsAt,
      endsAt,
      isVisible: typeof body.isVisible === "boolean" ? body.isVisible : undefined,
      backorderPolicy:
        body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
          ? body.backorderPolicy
          : undefined,
    },
  });

  return NextResponse.json({ data: collection }, { status: 201 });
};

