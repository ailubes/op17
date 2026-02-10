import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { getRouteParam, RouteContext } from "@/lib/route-context";
import { BackorderPolicy, CollectionStatus, SaleMode } from "@prisma/client";
import { logCollectionUpdated, logCollectionDeleted } from "@/lib/audit";

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

  const data: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (body.name !== undefined && body.name !== existing.name) {
    data.name = body.name.trim();
    changes.name = { from: existing.name, to: data.name };
  }
  if (body.slug !== undefined && body.slug !== existing.slug) {
    data.slug = body.slug.trim();
    changes.slug = { from: existing.slug, to: data.slug };
  }
  if (body.description !== undefined && body.description !== existing.description) {
    data.description = body.description.trim();
    changes.description = { from: existing.description, to: data.description };
  }
  if (status !== existing.status) {
    data.status = status;
    changes.status = { from: existing.status, to: status };
  }
  if (saleMode !== existing.saleMode) {
    data.saleMode = saleMode;
    changes.saleMode = { from: existing.saleMode, to: saleMode };
  }
  if (body.startsAt !== undefined) {
    const newStartsAt = body.startsAt ? startsAt : null;
    if (newStartsAt !== existing.startsAt) {
      data.startsAt = newStartsAt;
      changes.startsAt = { from: existing.startsAt, to: newStartsAt };
    }
  }
  if (body.endsAt !== undefined) {
    const newEndsAt = body.endsAt ? endsAt : null;
    if (newEndsAt !== existing.endsAt) {
      data.endsAt = newEndsAt;
      changes.endsAt = { from: existing.endsAt, to: newEndsAt };
    }
  }
  if (body.isVisible !== undefined && body.isVisible !== existing.isVisible) {
    data.isVisible = body.isVisible;
    changes.isVisible = { from: existing.isVisible, to: data.isVisible };
  }
  if (body.backorderPolicy !== undefined && body.backorderPolicy !== existing.backorderPolicy) {
    if (Object.values(BackorderPolicy).includes(body.backorderPolicy)) {
      data.backorderPolicy = body.backorderPolicy;
      changes.backorderPolicy = { from: existing.backorderPolicy, to: data.backorderPolicy };
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ data: existing });
  }

  const updated = await prisma.collection.update({
    where: { id: existing.id },
    data,
  });

  await logCollectionUpdated(session.userId, id, updated.name, changes, request);

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

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id } });

  await logCollectionDeleted(session.userId, id, collection.name, request);

  return NextResponse.json({ ok: true });
};

