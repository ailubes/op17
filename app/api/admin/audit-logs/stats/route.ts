import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuditAccess,
  jsonResponse,
  unauthorizedResponse,
} from "@/lib/guards";

// GET /api/admin/audit-logs/stats - Get audit log statistics
export async function GET(request: NextRequest) {
  const session = await requireAuditAccess(request);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    } else {
      // Default to last N days
      dateFilter.gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    // Fetch statistics
    const [
      totalEvents,
      eventsByType,
      eventsByActor,
      eventsByDay,
      recentEvents,
    ] = await Promise.all([
      // Total events in period
      prisma.adminEvent.count({
        where: { createdAt: dateFilter },
      }),

      // Events grouped by type
      prisma.adminEvent.groupBy({
        by: ["type"],
        where: { createdAt: dateFilter },
        _count: { type: true },
        orderBy: { _count: { type: "desc" } },
      }),

      // Top actors
      prisma.adminEvent.groupBy({
        by: ["actorId"],
        where: { createdAt: dateFilter },
        _count: { actorId: true },
        orderBy: { _count: { actorId: "desc" } },
        take: 10,
      }),

      // Events by day (for chart)
      prisma.$queryRaw<
        Array<{ date: string; count: bigint }>
      >`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "AdminEvent"
        WHERE "createdAt" >= ${dateFilter.gte}
        ${dateFilter.lte ? prisma.$queryRaw`AND "createdAt" <= ${dateFilter.lte}` : prisma.$queryRaw``}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Most recent events
      prisma.adminEvent.findMany({
        where: { createdAt: dateFilter },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          User_AdminEvent_actorIdToUser: {
            select: { email: true, name: true },
          },
        },
      }),
    ]);

    // Get actor details for top actors
    const actorIds = eventsByActor.map((e) => e.actorId);
    const actors =
      actorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, email: true, name: true },
          })
        : [];

    const actorMap = new Map(actors.map((a) => [a.id, a]));

    return jsonResponse({
      period: {
        start: dateFilter.gte,
        end: dateFilter.lte || new Date(),
        days,
      },
      total: totalEvents,
      byType: eventsByType.map((e) => ({
        type: e.type,
        count: e._count.type,
      })),
      byActor: eventsByActor.map((e) => ({
        actorId: e.actorId,
        count: e._count.actorId,
        actor: actorMap.get(e.actorId),
      })),
      byDay: eventsByDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      recent: recentEvents.map((e) => ({
        id: e.id,
        type: e.type,
        createdAt: e.createdAt,
        actor: e.User_AdminEvent_actorIdToUser,
      })),
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return jsonResponse({ error: "Failed to fetch audit statistics" }, 500);
  }
}
