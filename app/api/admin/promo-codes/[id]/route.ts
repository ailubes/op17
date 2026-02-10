import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { PromoType } from "@prisma/client";

// Valid promo types
const VALID_PROMO_TYPES: PromoType[] = ["PERCENT", "AMOUNT", "FREE_SHIPPING"];

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const promoCode = await prisma.promoCode.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          orderNumber: true,
          totalEur: true,
          status: true,
          createdAt: true,
          email: true,
        },
      },
    },
  });

  if (!promoCode) {
    return NextResponse.json(
      { error: "Promo code not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: promoCode });
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if promo code exists
  const existing = await prisma.promoCode.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Promo code not found" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // Type (cannot change if orders already used it)
  if (
    body.type !== undefined &&
    VALID_PROMO_TYPES.includes(body.type as PromoType)
  ) {
    if (existing.timesRedeemed > 0) {
      return NextResponse.json(
        { error: "Cannot change type after promo code has been used" },
        { status: 400 }
      );
    }
    updateData.type = body.type;
  }

  // Value (cannot change if orders already used it)
  if (body.value !== undefined) {
    if (existing.timesRedeemed > 0) {
      return NextResponse.json(
        { error: "Cannot change value after promo code has been used" },
        { status: 400 }
      );
    }

    const value = Number(body.value);
    if (isNaN(value) || value < 0) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }

    const typeToValidate = (body.type as PromoType) || existing.type;
    if (typeToValidate === "PERCENT" && value > 100) {
      return NextResponse.json(
        { error: "Percentage cannot exceed 100" },
        { status: 400 }
      );
    }

    updateData.value = value;
  }

  // Active status
  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  // Start date
  if (body.startsAt !== undefined) {
    if (body.startsAt === null) {
      updateData.startsAt = null;
    } else if (typeof body.startsAt === "string" && body.startsAt) {
      const startsAt = new Date(body.startsAt);
      if (isNaN(startsAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date" },
          { status: 400 }
        );
      }
      updateData.startsAt = startsAt;
    }
  }

  // End date
  if (body.endsAt !== undefined) {
    if (body.endsAt === null) {
      updateData.endsAt = null;
    } else if (typeof body.endsAt === "string" && body.endsAt) {
      const endsAt = new Date(body.endsAt);
      if (isNaN(endsAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }
      updateData.endsAt = endsAt;
    }
  }

  // Validate date range
  const startsAt = (updateData.startsAt as Date) ?? existing.startsAt;
  const endsAt = (updateData.endsAt as Date) ?? existing.endsAt;
  if (startsAt && endsAt && startsAt >= endsAt) {
    return NextResponse.json(
      { error: "End date must be after start date" },
      { status: 400 }
    );
  }

  // Max redemptions (can increase, but not decrease below current count)
  if (body.maxRedemptions !== undefined) {
    if (body.maxRedemptions === null) {
      updateData.maxRedemptions = null;
    } else {
      const maxRedemptions = Math.trunc(Number(body.maxRedemptions));
      if (isNaN(maxRedemptions) || maxRedemptions < 0) {
        return NextResponse.json(
          { error: "Max redemptions must be a positive number" },
          { status: 400 }
        );
      }
      if (maxRedemptions < existing.timesRedeemed) {
        return NextResponse.json(
          { error: "Cannot set max redemptions below current usage count" },
          { status: 400 }
        );
      }
      updateData.maxRedemptions = maxRedemptions;
    }
  }

  // Min subtotal
  if (body.minSubtotalEur !== undefined) {
    if (body.minSubtotalEur === null) {
      updateData.minSubtotalEur = null;
    } else {
      const minSubtotalEur = Math.trunc(Number(body.minSubtotalEur));
      if (isNaN(minSubtotalEur) || minSubtotalEur < 0) {
        return NextResponse.json(
          { error: "Min subtotal must be a positive number" },
          { status: 400 }
        );
      }
      updateData.minSubtotalEur = minSubtotalEur;
    }
  }

  // If nothing to update
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ data: existing });
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if promo code exists
  const existing = await prisma.promoCode.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Promo code not found" },
      { status: 404 }
    );
  }

  // Soft delete by setting isActive to false
  // This preserves order history
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ data: updated });
};
