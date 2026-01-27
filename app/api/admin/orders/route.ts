import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";

export const GET = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const limit = Number(searchParams.get("limit") || 50);
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      items: true,
      payments: { include: { refunds: true } },
      shipments: true,
      shippingAddress: true,
      events: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ data: orders });
};

