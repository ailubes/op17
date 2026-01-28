import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { OrderEventType, OrderStatus, RefundStatus } from "@prisma/client";
import { getRouteParam, RouteContext } from "@/lib/route-context";

const sumRefunds = (refunds: { amountMinor: number; status: string }[]) => {
  return refunds
    .filter((refund) => refund.status === RefundStatus.SUCCEEDED)
    .reduce((sum, refund) => sum + refund.amountMinor, 0);
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
  const status = body?.status;
  if (!Object.values(RefundStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.refund.findUnique({
    where: { id },
    include: { payment: { include: { order: true } } },
  });

  if (!existing || !existing.payment) {
    return NextResponse.json({ error: "Refund not found." }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.update({
      where: { id: existing.id },
      data: { status },
    });

    await tx.orderEvent.create({
      data: {
        orderId: existing.payment.orderId,
        type: OrderEventType.NOTE,
        message: `Refund ${refund.id} marked as ${status}`,
        createdById: session.userId,
        metadata: { refundId: refund.id, status },
      },
    });

    if (status === RefundStatus.SUCCEEDED) {
      const order = await tx.order.findUnique({
        where: { id: existing.payment.orderId },
        include: { payments: { include: { refunds: true } } },
      });

      if (order) {
        const totalRefunded = order.payments.reduce(
          (sum, payment) => sum + sumRefunds(payment.refunds || []),
          0
        );

        if (totalRefunded >= order.totalMinor && order.status !== OrderStatus.REFUNDED) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.REFUNDED },
          });

          await tx.orderEvent.create({
            data: {
              orderId: order.id,
              type: OrderEventType.STATUS_CHANGE,
              message: "Order marked as REFUNDED",
              metadata: { totalRefunded },
              createdById: session.userId,
            },
          });
        }
      }
    }

    return refund;
  });

  return NextResponse.json({ data: updated });
};

