import { prisma } from "@/lib/prisma";
import { PromoType, type PromoCode } from "@prisma/client";

export type PromoErrorCode =
  | "INVALID_CODE"
  | "INACTIVE"
  | "EXPIRED"
  | "NOT_YET_ACTIVE"
  | "MAX_REDEMPTIONS"
  | "MIN_SUBTOTAL";

export type PromoValidationResult =
  | {
      valid: true;
      promoCode: PromoCode;
      discountEur: number;
      message: string;
    }
  | {
      valid: false;
      error: PromoErrorCode;
      message: string;
    };

/**
 * Validate a promo code against current cart subtotal
 */
export async function validatePromoCode(
  code: string,
  subtotalEur: number
): Promise<PromoValidationResult> {
  // 1. Find code (case-insensitive)
  const promoCode = await prisma.promoCode.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
    },
  });

  if (!promoCode) {
    return {
      valid: false,
      error: "INVALID_CODE",
      message: "Promo code not found",
    };
  }

  // 2. Check active status
  if (!promoCode.isActive) {
    return {
      valid: false,
      error: "INACTIVE",
      message: "This promo code is no longer active",
    };
  }

  const now = new Date();

  // 3. Check start date
  if (promoCode.startsAt && promoCode.startsAt > now) {
    return {
      valid: false,
      error: "NOT_YET_ACTIVE",
      message: "This promo code is not yet active",
    };
  }

  // 4. Check end date
  if (promoCode.endsAt && promoCode.endsAt < now) {
    return {
      valid: false,
      error: "EXPIRED",
      message: "This promo code has expired",
    };
  }

  // 5. Check redemption limit
  if (
    promoCode.maxRedemptions !== null &&
    promoCode.timesRedeemed >= promoCode.maxRedemptions
  ) {
    return {
      valid: false,
      error: "MAX_REDEMPTIONS",
      message: "This promo code has reached its usage limit",
    };
  }

  // 6. Check minimum subtotal
  if (
    promoCode.minSubtotalEur !== null &&
    subtotalEur < promoCode.minSubtotalEur
  ) {
    return {
      valid: false,
      error: "MIN_SUBTOTAL",
      message: `Minimum order of EUR ${(promoCode.minSubtotalEur / 100).toFixed(2)} required`,
    };
  }

  // 7. Calculate discount
  const discountEur = calculateDiscount(
    promoCode.type,
    promoCode.value,
    subtotalEur
  );

  return {
    valid: true,
    promoCode,
    discountEur,
    message: formatDiscountMessage(promoCode.type, promoCode.value),
  };
}

/**
 * Calculate discount amount based on promo type
 */
export function calculateDiscount(
  type: PromoType,
  value: number,
  subtotalEur: number
): number {
  switch (type) {
    case "PERCENT":
      // value is percentage (0-100)
      // Discount cannot exceed subtotal
      return Math.min(Math.round((subtotalEur * value) / 100), subtotalEur);

    case "AMOUNT":
      // value is in EUR cents
      // Discount cannot exceed subtotal
      return Math.min(value, subtotalEur);

    case "FREE_SHIPPING":
      // Returns 0 as shipping is currently free
      // When shipping costs are implemented, this would return shippingEur
      return 0;

    default:
      return 0;
  }
}

/**
 * Format a user-friendly discount message
 */
export function formatDiscountMessage(type: PromoType, value: number): string {
  switch (type) {
    case "PERCENT":
      return `${value}% discount applied`;
    case "AMOUNT":
      return `EUR ${(value / 100).toFixed(2)} discount applied`;
    case "FREE_SHIPPING":
      return "Free shipping applied";
    default:
      return "Discount applied";
  }
}

/**
 * Generate a random promo code suffix
 * Excludes confusing characters: I, O, 0, 1
 */
export function generatePromoCodeSuffix(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique batch of promo codes
 * Returns array of generated code strings
 */
export async function generateBatchPromoCodes(
  prefix: string,
  count: number,
  suffixLength: number = 6
): Promise<string[]> {
  const codes: string[] = [];
  const maxAttempts = count * 10; // Prevent infinite loops
  let attempts = 0;

  while (codes.length < count && attempts < maxAttempts) {
    attempts++;
    const suffix = generatePromoCodeSuffix(suffixLength);
    const code = `${prefix}${suffix}`;

    // Check if code already exists in database or in our current batch
    const existsInDb = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!existsInDb && !codes.includes(code)) {
      codes.push(code);
    }
  }

  if (codes.length < count) {
    throw new Error(
      `Could only generate ${codes.length} unique codes out of ${count} requested. Try a longer prefix or suffix length.`
    );
  }

  return codes;
}

/**
 * Get error message for a promo error code
 */
export function getPromoErrorMessage(
  errorCode: PromoErrorCode,
  t: Record<string, string>
): string {
  const messages: Record<PromoErrorCode, string> = {
    INVALID_CODE: t["errors.INVALID_CODE"] || "Promo code not found",
    INACTIVE: t["errors.INACTIVE"] || "This promo code is no longer active",
    EXPIRED: t["errors.EXPIRED"] || "This promo code has expired",
    NOT_YET_ACTIVE:
      t["errors.NOT_YET_ACTIVE"] || "This promo code is not yet active",
    MAX_REDEMPTIONS:
      t["errors.MAX_REDEMPTIONS"] ||
      "This promo code has reached its usage limit",
    MIN_SUBTOTAL:
      t["errors.MIN_SUBTOTAL"] || "Minimum order requirement not met",
  };

  return messages[errorCode] || "Invalid promo code";
}
