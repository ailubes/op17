import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { getRouteParam, type RouteContext } from "@/lib/route-context";
import { logCategoryUpdated, logCategoryDeleted } from "@/lib/audit";

export const GET = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: true, products: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: category });
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

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (body.name !== undefined && body.name !== existingCategory.name) {
    data.name = body.name.trim();
    changes.name = { from: existingCategory.name, to: data.name };
  }
  if (body.slug !== undefined && body.slug !== existingCategory.slug) {
    data.slug = body.slug.trim();
    changes.slug = { from: existingCategory.slug, to: data.slug };
  }
  if (body.parentId !== undefined && body.parentId !== existingCategory.parentId) {
    data.parentId = body.parentId;
    changes.parentId = { from: existingCategory.parentId, to: data.parentId };
  }
  if (body.sortOrder !== undefined && body.sortOrder !== existingCategory.sortOrder) {
    if (Number.isFinite(body.sortOrder)) {
      data.sortOrder = Math.trunc(body.sortOrder);
      changes.sortOrder = { from: existingCategory.sortOrder, to: data.sortOrder };
    }
  }
  if (body.isActive !== undefined && body.isActive !== existingCategory.isActive) {
    data.isActive = body.isActive;
    changes.isActive = { from: existingCategory.isActive, to: data.isActive };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ data: existingCategory });
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
  });

  await logCategoryUpdated(session.userId, id, updated.name, changes, request);

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

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });

  await logCategoryDeleted(session.userId, id, category.name, request);

  return NextResponse.json({ ok: true });
};

