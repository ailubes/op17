import { prisma } from "@/lib/prisma";
import { AdminEventType } from "@prisma/client";

interface LogAdminEventParams {
  /** The user ID performing the action */
  actorId: string;
  /** The type of admin event */
  type: AdminEventType;
  /** The target user ID (if applicable) */
  targetUserId?: string;
  /** Additional metadata about the event */
  metadata?: Record<string, unknown>;
  /** The request object to extract IP and user agent */
  request: Request;
}

/**
 * Log an admin event for audit purposes
 */
export async function logAdminEvent({
  actorId,
  type,
  targetUserId,
  metadata,
  request,
}: LogAdminEventParams): Promise<void> {
  try {
    // Extract IP address from headers
    const headers = request.headers;
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "unknown";

    // Extract user agent
    const userAgent = headers.get("user-agent") || "unknown";

    await prisma.adminEvent.create({
      data: {
        actorId,
        type,
        targetUserId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break functionality
    console.error("Failed to log admin event:", error);
  }
}

/**
 * Log user creation
 */
export async function logUserCreated(
  actorId: string,
  targetUserId: string,
  email: string,
  roles: string[],
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_CREATED,
    targetUserId,
    metadata: { email, roles },
    request,
  });
}

/**
 * Log user update
 */
export async function logUserUpdated(
  actorId: string,
  targetUserId: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_UPDATED,
    targetUserId,
    metadata: { changes },
    request,
  });
}

/**
 * Log user roles update
 */
export async function logUserRolesUpdated(
  actorId: string,
  targetUserId: string,
  oldRoles: string[],
  newRoles: string[],
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_ROLES_UPDATED,
    targetUserId,
    metadata: { oldRoles, newRoles },
    request,
  });
}

/**
 * Log user deactivation
 */
export async function logUserDeactivated(
  actorId: string,
  targetUserId: string,
  reason: string | undefined,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_DEACTIVATED,
    targetUserId,
    metadata: { reason },
    request,
  });
}

/**
 * Log user reactivation
 */
export async function logUserReactivated(
  actorId: string,
  targetUserId: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_REACTIVATED,
    targetUserId,
    request,
  });
}

/**
 * Log password reset link generated
 */
export async function logPasswordResetLink(
  actorId: string,
  targetUserId: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_PASSWORD_RESET_LINK,
    targetUserId,
    request,
  });
}

/**
 * Log user invite link generated
 */
export async function logUserInviteLink(
  actorId: string,
  targetUserId: string,
  email: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_INVITE_LINK,
    targetUserId,
    metadata: { email },
    request,
  });
}

/**
 * Log user login
 */
export async function logUserLogin(
  actorId: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_LOGIN,
    request,
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(
  actorId: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.USER_LOGOUT,
    request,
  });
}

// Product audit logs

/**
 * Log product creation
 */
export async function logProductCreated(
  actorId: string,
  productId: string,
  productName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PRODUCT_CREATED,
    metadata: { productId, productName },
    request,
  });
}

/**
 * Log product update
 */
export async function logProductUpdated(
  actorId: string,
  productId: string,
  productName: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PRODUCT_UPDATED,
    metadata: { productId, productName, changes },
    request,
  });
}

/**
 * Log product deletion
 */
export async function logProductDeleted(
  actorId: string,
  productId: string,
  productName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PRODUCT_DELETED,
    metadata: { productId, productName },
    request,
  });
}

// Variant audit logs

/**
 * Log variant creation
 */
export async function logVariantCreated(
  actorId: string,
  variantId: string,
  sku: string,
  productId: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.VARIANT_CREATED,
    metadata: { variantId, sku, productId },
    request,
  });
}

/**
 * Log variant update
 */
export async function logVariantUpdated(
  actorId: string,
  variantId: string,
  sku: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.VARIANT_UPDATED,
    metadata: { variantId, sku, changes },
    request,
  });
}

/**
 * Log variant deletion
 */
export async function logVariantDeleted(
  actorId: string,
  variantId: string,
  sku: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.VARIANT_DELETED,
    metadata: { variantId, sku },
    request,
  });
}

/**
 * Log variant stock update
 */
export async function logVariantStockUpdated(
  actorId: string,
  variantId: string,
  sku: string,
  oldStock: number,
  newStock: number,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.VARIANT_STOCK_UPDATED,
    metadata: { variantId, sku, oldStock, newStock },
    request,
  });
}

// Order audit logs

/**
 * Log order status update
 */
export async function logOrderStatusUpdated(
  actorId: string,
  orderId: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.ORDER_STATUS_UPDATED,
    metadata: { orderId, orderNumber, oldStatus, newStatus },
    request,
  });
}

/**
 * Log order tracking added
 */
export async function logOrderTrackingAdded(
  actorId: string,
  orderId: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.ORDER_TRACKING_ADDED,
    metadata: { orderId, orderNumber, trackingNumber, carrier },
    request,
  });
}

/**
 * Log order note added
 */
export async function logOrderNoteAdded(
  actorId: string,
  orderId: string,
  orderNumber: string,
  note: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.ORDER_NOTE_ADDED,
    metadata: { orderId, orderNumber, note },
    request,
  });
}

// Refund audit logs

/**
 * Log refund creation
 */
export async function logRefundCreated(
  actorId: string,
  refundId: string,
  orderId: string,
  orderNumber: string,
  amount: number,
  currency: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.REFUND_CREATED,
    metadata: { refundId, orderId, orderNumber, amount, currency },
    request,
  });
}

/**
 * Log refund update
 */
export async function logRefundUpdated(
  actorId: string,
  refundId: string,
  orderId: string,
  orderNumber: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.REFUND_UPDATED,
    metadata: { refundId, orderId, orderNumber, changes },
    request,
  });
}

// Category audit logs

/**
 * Log category creation
 */
export async function logCategoryCreated(
  actorId: string,
  categoryId: string,
  categoryName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.CATEGORY_CREATED,
    metadata: { categoryId, categoryName },
    request,
  });
}

/**
 * Log category update
 */
export async function logCategoryUpdated(
  actorId: string,
  categoryId: string,
  categoryName: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.CATEGORY_UPDATED,
    metadata: { categoryId, categoryName, changes },
    request,
  });
}

/**
 * Log category deletion
 */
export async function logCategoryDeleted(
  actorId: string,
  categoryId: string,
  categoryName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.CATEGORY_DELETED,
    metadata: { categoryId, categoryName },
    request,
  });
}

// Collection audit logs

/**
 * Log collection creation
 */
export async function logCollectionCreated(
  actorId: string,
  collectionId: string,
  collectionName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.COLLECTION_CREATED,
    metadata: { collectionId, collectionName },
    request,
  });
}

/**
 * Log collection update
 */
export async function logCollectionUpdated(
  actorId: string,
  collectionId: string,
  collectionName: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.COLLECTION_UPDATED,
    metadata: { collectionId, collectionName, changes },
    request,
  });
}

/**
 * Log collection deletion
 */
export async function logCollectionDeleted(
  actorId: string,
  collectionId: string,
  collectionName: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.COLLECTION_DELETED,
    metadata: { collectionId, collectionName },
    request,
  });
}

// Promo code audit logs

/**
 * Log promo code creation
 */
export async function logPromoCodeCreated(
  actorId: string,
  promoCodeId: string,
  code: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PROMO_CODE_CREATED,
    metadata: { promoCodeId, code },
    request,
  });
}

/**
 * Log promo code update
 */
export async function logPromoCodeUpdated(
  actorId: string,
  promoCodeId: string,
  code: string,
  changes: Record<string, unknown>,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PROMO_CODE_UPDATED,
    metadata: { promoCodeId, code, changes },
    request,
  });
}

/**
 * Log promo code deletion
 */
export async function logPromoCodeDeleted(
  actorId: string,
  promoCodeId: string,
  code: string,
  request: Request
): Promise<void> {
  await logAdminEvent({
    actorId,
    type: AdminEventType.PROMO_CODE_DELETED,
    metadata: { promoCodeId, code },
    request,
  });
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs({
  actorId,
  targetUserId,
  type,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}: {
  actorId?: string;
  targetUserId?: string;
  type?: AdminEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (actorId) where.actorId = actorId;
  if (targetUserId) where.targetUserId = targetUserId;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.adminEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        User_AdminEvent_actorIdToUser: {
          select: { email: true, name: true },
        },
        User_AdminEvent_targetUserIdToUser: {
          select: { email: true, name: true },
        },
      },
    }),
    prisma.adminEvent.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats({
  startDate,
  endDate,
}: {
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [total, byType, byActor] = await Promise.all([
    prisma.adminEvent.count({ where }),
    prisma.adminEvent.groupBy({
      by: ["type"],
      where,
      _count: { type: true },
    }),
    prisma.adminEvent.groupBy({
      by: ["actorId"],
      where,
      _count: { actorId: true },
      orderBy: { _count: { actorId: "desc" } },
      take: 10,
    }),
  ]);

  // Get actor details for the top actors
  const actorIds = byActor.map((a) => a.actorId);
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

  const actorMap = new Map(actors.map((a) => [a.id, a]));

  return {
    total,
    byType: byType.map((t) => ({
      type: t.type,
      count: t._count.type,
    })),
    byActor: byActor.map((a) => ({
      actorId: a.actorId,
      count: a._count.actorId,
      actor: actorMap.get(a.actorId),
    })),
  };
}
