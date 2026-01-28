import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { OrderEventType, RefundStatus } from "@prisma/client";
import { getRouteParam, RouteContext } from "@/lib/route-context";

const sumRefunds = (refunds: { amountMinor: number; status: string }[]) => {
  return refunds
    .filter((refund) => refund.status !== RefundStatus.FAILED)
    .reduce((sum, refund) => sum + refund.amountMinor, 0);
};

export const POST = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const amountMinorRaw = Number(body?.amountMinor);
  const amountMajorRaw = Number(body?.amount);
  const amountMinor = Number.isFinite(amountMinorRaw)
    ? Math.round(amountMinorRaw)
    : Number.isFinite(amountMajorRaw)
      ? Math.round(amountMajorRaw * 100)
      : NaN;

  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return NextResponse.json({ error: "Refund amount is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: { include: { refunds: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paymentId = typeof body?.paymentId === "string" ? body.paymentId : null;
  const payment = paymentId
    ? order.payments.find((entry) => entry.id === paymentId)
    : order.payments[0];

  if (!payment) {
    return NextResponse.json({ error: "No payment found for this order." }, { status: 400 });
  }

  const refunded = sumRefunds(payment.refunds || []);
  const remaining = payment.amountMinor - refunded;
  if (amountMinor > remaining) {
    return NextResponse.json({ error: "Refund exceeds payment amount." }, { status: 400 });
  }

  const reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;

  const refund = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      amountMinor,
      status: RefundStatus.PENDING,
      reason,
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: OrderEventType.REFUND_CREATED,
      message: `Refund initiated: ${amountMinor / 100} ${payment.currency}`,
      metadata: { amountMinor, currency: payment.currency, paymentId: payment.id },
      createdById: session.userId,
    },
  });

  return NextResponse.json({ data: refund }, { status: 201 });
};

