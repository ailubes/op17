import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export const GET = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { children: true },
  });

  return NextResponse.json({ data: categories });
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

  const category = await prisma.category.create({
    data: {
      name: body.name.trim(),
      slug: body.slug.trim(),
      parentId: typeof body.parentId === "string" ? body.parentId : undefined,
      sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
};

