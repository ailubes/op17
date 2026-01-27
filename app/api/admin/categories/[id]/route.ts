import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export const GET = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = await prisma.category.findUnique({
    where: { id: context.params.id },
    include: { children: true, products: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: category });
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

  const updated = await prisma.category.update({
    where: { id: context.params.id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      slug: typeof body.slug === "string" ? body.slug.trim() : undefined,
      parentId: typeof body.parentId === "string" ? body.parentId : undefined,
      sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    },
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.category.delete({ where: { id: context.params.id } });
  return NextResponse.json({ ok: true });
};

