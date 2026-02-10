import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePromoCode } from "@/lib/promo";
import { getOrCreateCart } from "@/lib/cart";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json(
      { valid: false, error: "INVALID_CODE", message: "Promo code is required" },
      { status: 400 }
    );
  }

  const code = body.code.trim();

  // Get cart to calculate subtotal
  let subtotalEur = 0;
  try {
    const { cart } = await getOrCreateCart(request);
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (cartWithItems?.items) {
      subtotalEur = cartWithItems.items.reduce(
        (sum, item) => sum + item.unitPriceEur * item.quantity,
        0
      );
    }
  } catch {
    // If cart fails, proceed with 0 subtotal - validation will check minSubtotalEur
    subtotalEur = 0;
  }

  // Validate the promo code
  const result = await validatePromoCode(code, subtotalEur);

  // Return structured response
  if (result.valid) {
    return NextResponse.json({
      valid: true,
      code: result.promoCode.code,
      type: result.promoCode.type,
      value: result.promoCode.value,
      discountEur: result.discountEur,
      message: result.message,
    });
  } else {
    return NextResponse.json({
      valid: false,
      error: (result as { error: string }).error,
      message: result.message,
    });
  }
};
