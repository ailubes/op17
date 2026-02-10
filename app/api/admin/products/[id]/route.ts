import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { BackorderPolicy } from "@prisma/client";
import { roundWhole } from "@/lib/pricing";
import { getRouteParam, RouteContext } from "@/lib/route-context";
import { logProductUpdated, logProductDeleted } from "@/lib/audit";

const parseWhole = (value: unknown) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }
  return roundWhole(numberValue);
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

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, collection: true, variants: true, media: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
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

  // Get existing product for audit log
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (body.name !== undefined && body.name !== existingProduct.name) {
    data.name = body.name.trim();
    changes.name = { from: existingProduct.name, to: data.name };
  }
  if (body.slug !== undefined && body.slug !== existingProduct.slug) {
    data.slug = body.slug.trim();
    changes.slug = { from: existingProduct.slug, to: data.slug };
  }
  if (body.description !== undefined && body.description !== existingProduct.description) {
    data.description = body.description.trim();
    changes.description = { from: existingProduct.description, to: data.description };
  }
  if (body.type !== undefined && body.type !== existingProduct.type) {
    data.type = body.type.trim();
    changes.type = { from: existingProduct.type, to: data.type };
  }
  if (body.gender !== undefined && body.gender !== existingProduct.gender) {
    data.gender = body.gender.trim();
    changes.gender = { from: existingProduct.gender, to: data.gender };
  }
  if (body.sport !== undefined && body.sport !== existingProduct.sport) {
    data.sport = body.sport.trim();
    changes.sport = { from: existingProduct.sport, to: data.sport };
  }
  if (body.categoryId !== undefined && body.categoryId !== existingProduct.categoryId) {
    data.categoryId = body.categoryId;
    changes.categoryId = { from: existingProduct.categoryId, to: data.categoryId };
  }
  if (body.collectionId !== undefined && body.collectionId !== existingProduct.collectionId) {
    data.collectionId = body.collectionId;
    changes.collectionId = { from: existingProduct.collectionId, to: data.collectionId };
  }
  if (body.isActive !== undefined && body.isActive !== existingProduct.isActive) {
    data.isActive = body.isActive;
    changes.isActive = { from: existingProduct.isActive, to: data.isActive };
  }
  if (body.isFeatured !== undefined && body.isFeatured !== existingProduct.isFeatured) {
    data.isFeatured = body.isFeatured;
    changes.isFeatured = { from: existingProduct.isFeatured, to: data.isFeatured };
  }
  if (body.backorderPolicy !== undefined && body.backorderPolicy !== existingProduct.backorderPolicy) {
    if (Object.values(BackorderPolicy).includes(body.backorderPolicy)) {
      data.backorderPolicy = body.backorderPolicy;
      changes.backorderPolicy = { from: existingProduct.backorderPolicy, to: data.backorderPolicy };
    }
  }

  if (body.basePriceEur !== undefined) {
    const basePriceEur = parseWhole(body.basePriceEur);
    if (basePriceEur === null) {
      return NextResponse.json({ error: "basePriceEur must be a number." }, { status: 400 });
    }
    if (basePriceEur !== existingProduct.basePriceEur) {
      data.basePriceEur = basePriceEur;
      changes.basePriceEur = { from: existingProduct.basePriceEur, to: data.basePriceEur };
    }
  }

  // If no changes, return early
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ data: existingProduct });
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
  });

  // Log product update
  await logProductUpdated(
    session.userId,
    id,
    updated.name,
    changes,
    request
  );

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

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  // Log product deletion
  await logProductDeleted(
    session.userId,
    id,
    product.name,
    request
  );

  return NextResponse.json({ ok: true });
};

