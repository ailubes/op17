import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { getRouteParam, RouteContext } from "@/lib/route-context";
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

export const GET = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { products: true, media: true },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: collection });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const existing = await prisma.collection.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = body.status ?? existing.status;
  const saleMode = body.saleMode ?? existing.saleMode;

  if (status === CollectionStatus.LIVE && saleMode === SaleMode.DROP) {
    const ok = await ensureSingleLiveDrop(existing.id);
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

  const updated = await prisma.collection.update({
    where: { id: existing.id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      slug: typeof body.slug === "string" ? body.slug.trim() : undefined,
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      status,
      saleMode,
      startsAt: body.startsAt ? startsAt : undefined,
      endsAt: body.endsAt ? endsAt : undefined,
      isVisible: typeof body.isVisible === "boolean" ? body.isVisible : undefined,
      backorderPolicy:
        body.backorderPolicy && Object.values(BackorderPolicy).includes(body.backorderPolicy)
          ? body.backorderPolicy
          : undefined,
    },
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
};

