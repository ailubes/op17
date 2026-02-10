import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { BackorderPolicy } from "@prisma/client";
import { roundWhole } from "@/lib/pricing";
import { getRouteParam, RouteContext } from "@/lib/route-context";
import {
  logVariantUpdated,
  logVariantDeleted,
  logVariantStockUpdated,
} from "@/lib/audit";

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

  const variant = await prisma.variant.findUnique({
    where: { id },
    include: { product: true, media: true },
  });

  if (!variant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: variant });
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

  // Get existing variant for audit log
  const existingVariant = await prisma.variant.findUnique({
    where: { id },
  });

  if (!existingVariant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (body.sku !== undefined && body.sku !== existingVariant.sku) {
    data.sku = body.sku.trim();
    changes.sku = { from: existingVariant.sku, to: data.sku };
  }
  if (body.name !== undefined && body.name !== existingVariant.name) {
    data.name = body.name.trim();
    changes.name = { from: existingVariant.name, to: data.name };
  }
  if (body.size !== undefined && body.size !== existingVariant.size) {
    data.size = body.size.trim();
    changes.size = { from: existingVariant.size, to: data.size };
  }
  if (body.color !== undefined && body.color !== existingVariant.color) {
    data.color = body.color.trim();
    changes.color = { from: existingVariant.color, to: data.color };
  }
  if (body.isActive !== undefined && body.isActive !== existingVariant.isActive) {
    data.isActive = body.isActive;
    changes.isActive = { from: existingVariant.isActive, to: data.isActive };
  }
  if (body.productId !== undefined && body.productId !== existingVariant.productId) {
    data.productId = body.productId;
    changes.productId = { from: existingVariant.productId, to: data.productId };
  }
  if (body.backorderPolicy !== undefined && body.backorderPolicy !== existingVariant.backorderPolicy) {
    if (Object.values(BackorderPolicy).includes(body.backorderPolicy)) {
      data.backorderPolicy = body.backorderPolicy;
      changes.backorderPolicy = { from: existingVariant.backorderPolicy, to: data.backorderPolicy };
    }
  }

  if (body.priceEur !== undefined) {
    const priceEur = parseWhole(body.priceEur);
    if (priceEur === null) {
      return NextResponse.json({ error: "priceEur must be a number." }, { status: 400 });
    }
    if (priceEur !== existingVariant.priceEur) {
      data.priceEur = priceEur;
      changes.priceEur = { from: existingVariant.priceEur, to: data.priceEur };
    }
  }

  let stockUpdated = false;
  const oldStock = existingVariant.stock;
  if (body.stock !== undefined) {
    if (!Number.isFinite(body.stock)) {
      return NextResponse.json({ error: "stock must be a number." }, { status: 400 });
    }
    const newStock = Math.trunc(body.stock);
    if (newStock !== existingVariant.stock) {
      data.stock = newStock;
      changes.stock = { from: existingVariant.stock, to: data.stock };
      stockUpdated = true;
    }
  }

  // If no changes, return early
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ data: existingVariant });
  }

  const updated = await prisma.variant.update({
    where: { id },
    data,
  });

  // Log variant update
  if (stockUpdated && Object.keys(changes).length === 1 && changes.stock) {
    // Only stock changed - use stock-specific log
    await logVariantStockUpdated(
      session.userId,
      id,
      updated.sku,
      oldStock,
      updated.stock,
      request
    );
  } else if (Object.keys(changes).length > 0) {
    // Other changes
    await logVariantUpdated(
      session.userId,
      id,
      updated.sku,
      changes,
      request
    );
  }

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

  const variant = await prisma.variant.findUnique({
    where: { id },
  });

  if (!variant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.variant.delete({ where: { id } });

  // Log variant deletion
  await logVariantDeleted(
    session.userId,
    id,
    variant.sku,
    request
  );

  return NextResponse.json({ ok: true });
};

