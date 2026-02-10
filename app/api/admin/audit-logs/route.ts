import { NextRequest } from "next/server";
import { AdminEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireAuditAccess,
  jsonResponse,
  unauthorizedResponse,
} from "@/lib/guards";

// GET /api/admin/audit-logs - List audit logs with filtering
export async function GET(request: NextRequest) {
  const session = await requireAuditAccess(request);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const actorId = searchParams.get("actorId") || undefined;
    const targetUserId = searchParams.get("targetUserId") || undefined;
    const type = searchParams.get("type") as AdminEventType | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || undefined;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (actorId) where.actorId = actorId;
    if (targetUserId) where.targetUserId = targetUserId;
    if (type) where.type = type;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Search in metadata (simplified search)
    if (search) {
      where.OR = [
        {
          User_AdminEvent_actorIdToUser: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          User_AdminEvent_actorIdToUser: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.adminEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          User_AdminEvent_actorIdToUser: {
            select: { id: true, email: true, name: true },
          },
          User_AdminEvent_targetUserIdToUser: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.adminEvent.count({ where }),
    ]);

    // Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      type: log.type,
      metadata: log.metadata,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: log.User_AdminEvent_actorIdToUser,
      targetUser: log.User_AdminEvent_targetUserIdToUser,
    }));

    return jsonResponse({
      logs: formattedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return jsonResponse({ error: "Failed to fetch audit logs" }, 500);
  }
}
