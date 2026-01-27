import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!orderNumber || !email) {
    return NextResponse.json({ error: "orderNumber and email are required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order || order.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      currency: order.currency,
      totalMinor: order.totalMinor,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPriceEur: item.unitPriceEur,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        provider: payment.provider,
        status: payment.status,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
      })),
      shipments: order.shipments.map((shipment) => ({
        id: shipment.id,
        status: shipment.status,
        trackingNumber: shipment.trackingNumber,
        method: shipment.method,
      })),
    },
  });
};
