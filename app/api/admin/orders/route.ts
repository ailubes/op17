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
  const search = searchParams.get("search") || undefined;
  const limit = Number(searchParams.get("limit") || 50);
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const searchLower = search.toLowerCase();
    where.OR = [
      { orderNumber: { contains: searchLower, mode: "insensitive" } },
      { email: { contains: searchLower, mode: "insensitive" } },
      { phone: { contains: searchLower, mode: "insensitive" } },
      {
        shippingAddress: {
          name: { contains: searchLower, mode: "insensitive" },
        },
      },
    ];
  }

  const orders = await prisma.order.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
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

