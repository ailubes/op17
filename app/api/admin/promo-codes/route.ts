import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { PromoType } from "@prisma/client";
import { generateBatchPromoCodes } from "@/lib/promo";
import { logPromoCodeCreated } from "@/lib/audit";

// Valid promo types
const VALID_PROMO_TYPES: PromoType[] = ["PERCENT", "AMOUNT", "FREE_SHIPPING"];

export const GET = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = {};

  if (search) {
    where.code = { contains: search, mode: "insensitive" };
  }

  if (isActive === "true") {
    where.isActive = true;
  } else if (isActive === "false") {
    where.isActive = false;
  }

  const [promoCodes, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.promoCode.count({ where }),
  ]);

  return NextResponse.json({ data: promoCodes, total });
};

export const POST = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Batch generation mode
  if (body.batch === true) {
    return handleBatchCreate(body);
  }

  // Single code creation
  return handleSingleCreate(body, session.userId, request);
};

async function handleSingleCreate(body: Record<string, unknown>, actorId: string, request: Request) {
  // Validate required fields
  if (typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  if (!VALID_PROMO_TYPES.includes(body.type as PromoType)) {
    return NextResponse.json({ error: "Invalid promo type" }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  const type = body.type as PromoType;

  // Validate value based on type
  let value = 0;
  if (type !== "FREE_SHIPPING") {
    if (typeof body.value !== "number" || body.value < 0) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }
    value = body.value;

    if (type === "PERCENT" && value > 100) {
      return NextResponse.json(
        { error: "Percentage cannot exceed 100" },
        { status: 400 }
      );
    }
  }

  // Parse optional dates
  let startsAt: Date | undefined;
  let endsAt: Date | undefined;

  if (typeof body.startsAt === "string" && body.startsAt) {
    startsAt = new Date(body.startsAt);
    if (isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 }
      );
    }
  }

  if (typeof body.endsAt === "string" && body.endsAt) {
    endsAt = new Date(body.endsAt);
    if (isNaN(endsAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid end date" },
        { status: 400 }
      );
    }
  }

  // Validate date range
  if (startsAt && endsAt && startsAt >= endsAt) {
    return NextResponse.json(
      { error: "End date must be after start date" },
      { status: 400 }
    );
  }

  // Parse optional integers
  const maxRedemptions =
    typeof body.maxRedemptions === "number" && body.maxRedemptions > 0
      ? Math.trunc(body.maxRedemptions)
      : undefined;

  const minSubtotalEur =
    typeof body.minSubtotalEur === "number" && body.minSubtotalEur >= 0
      ? Math.trunc(body.minSubtotalEur)
      : undefined;

  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        type,
        value,
        isActive,
        startsAt,
        endsAt,
        maxRedemptions,
        minSubtotalEur,
      },
    });

    // Log promo code creation
    await logPromoCodeCreated(actorId, promoCode.id, promoCode.code, request);

    return NextResponse.json({ data: promoCode }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "A promo code with this code already exists" },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function handleBatchCreate(body: Record<string, unknown>) {
  // Validate batch parameters
  if (typeof body.prefix !== "string" || !body.prefix.trim()) {
    return NextResponse.json(
      { error: "Prefix is required for batch generation" },
      { status: 400 }
    );
  }

  const count =
    typeof body.count === "number" && body.count > 0
      ? Math.min(Math.trunc(body.count), 1000) // Max 1000 per batch
      : 0;

  if (count === 0) {
    return NextResponse.json(
      { error: "Count must be between 1 and 1000" },
      { status: 400 }
    );
  }

  if (!VALID_PROMO_TYPES.includes(body.type as PromoType)) {
    return NextResponse.json({ error: "Invalid promo type" }, { status: 400 });
  }

  const prefix = body.prefix.trim().toUpperCase();
  const type = body.type as PromoType;
  const suffixLength =
    typeof body.suffixLength === "number" && body.suffixLength >= 4
      ? Math.trunc(body.suffixLength)
      : 6;

  // Validate value
  let value = 0;
  if (type !== "FREE_SHIPPING") {
    if (typeof body.value !== "number" || body.value < 0) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }
    value = body.value;

    if (type === "PERCENT" && value > 100) {
      return NextResponse.json(
        { error: "Percentage cannot exceed 100" },
        { status: 400 }
      );
    }
  }

  // Parse optional fields
  let startsAt: Date | undefined;
  let endsAt: Date | undefined;

  if (typeof body.startsAt === "string" && body.startsAt) {
    startsAt = new Date(body.startsAt);
  }

  if (typeof body.endsAt === "string" && body.endsAt) {
    endsAt = new Date(body.endsAt);
  }

  const maxRedemptions =
    typeof body.maxRedemptions === "number" && body.maxRedemptions > 0
      ? Math.trunc(body.maxRedemptions)
      : undefined;

  const minSubtotalEur =
    typeof body.minSubtotalEur === "number" && body.minSubtotalEur >= 0
      ? Math.trunc(body.minSubtotalEur)
      : undefined;

  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  // Generate unique codes
  let codes: string[];
  try {
    codes = await generateBatchPromoCodes(prefix, count, suffixLength);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate unique codes",
      },
      { status: 400 }
    );
  }

  // Create all promo codes in a transaction
  try {
    const createdPromoCodes = await prisma.$transaction(
      codes.map((code) =>
        prisma.promoCode.create({
          data: {
            code,
            type,
            value,
            isActive,
            startsAt,
            endsAt,
            maxRedemptions,
            minSubtotalEur,
          },
        })
      )
    );

    return NextResponse.json(
      {
        data: {
          created: createdPromoCodes.length,
          codes: createdPromoCodes.map((p) => p.code),
          promoCodes: createdPromoCodes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create promo codes" },
      { status: 500 }
    );
  }
}
