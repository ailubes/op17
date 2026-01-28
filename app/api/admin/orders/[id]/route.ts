import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import {
  OrderEventType,
  OrderStatus,
  Prisma,
  ShipmentStatus,
  ShippingCarrier,
  ShippingMethod,
} from "@prisma/client";
import { getRouteParam, RouteContext } from "@/lib/route-context";

export const GET = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { include: { refunds: true } },
      shipments: true,
      shippingAddress: true,
      user: true,
      events: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: order });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { shipments: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  const events: { type: OrderEventType; message: string; metadata?: Prisma.InputJsonValue }[] = [];

  if (body.status && Object.values(OrderStatus).includes(body.status)) {
    if (body.status !== order.status) {
      data.status = body.status;
      events.push({
        type: OrderEventType.STATUS_CHANGE,
        message: `Status updated: ${order.status} > ${body.status}`,
        metadata: { from: order.status, to: body.status } as Prisma.JsonObject,
      });
    }
  }

  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";
  const shipmentStatus =
    body.shipmentStatus && Object.values(ShipmentStatus).includes(body.shipmentStatus)
      ? body.shipmentStatus
      : undefined;

  const shouldUpdateShipment = Boolean(trackingNumber || shipmentStatus);

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldUpdateShipment) {
      const existingShipment = order.shipments[0];
      if (existingShipment) {
        await tx.shipment.update({
          where: { id: existingShipment.id },
          data: {
            trackingNumber: trackingNumber || undefined,
            status: shipmentStatus || undefined,
          },
        });
      } else {
        await tx.shipment.create({
          data: {
            orderId: order.id,
            carrier: ShippingCarrier.NOVA_POST,
            method: order.shippingMethod || ShippingMethod.NOVA_POST_BRANCH,
            status: shipmentStatus || ShipmentStatus.PENDING,
            trackingNumber: trackingNumber || undefined,
          },
        });
      }

      events.push({
        type: OrderEventType.SHIPMENT_UPDATE,
        message: trackingNumber
          ? `Shipment updated: ${trackingNumber}`
          : "Shipment status updated",
        metadata: {
          trackingNumber: trackingNumber || undefined,
          status: shipmentStatus || undefined,
        } as Prisma.JsonObject,
      });
    }

    const updatedOrder = Object.keys(data).length
      ? await tx.order.update({
          where: { id: order.id },
          data,
        })
      : order;

    if (events.length > 0) {
      await tx.orderEvent.createMany({
        data: events.map((event) => ({
          orderId: order.id,
          type: event.type,
          message: event.message,
          metadata: event.metadata,
          createdById: session.userId,
        })),
      });
    }

    return updatedOrder;
  });

  return NextResponse.json({ data: updated });
};

