import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMonobankSignature } from "@/lib/payments.monobank";
import { OrderEventType, OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

const mapStatus = (status?: string | null) => {
  if (!status) return PaymentStatus.PENDING;
  const normalized = status.toLowerCase();
  if (["success", "paid"].includes(normalized)) return PaymentStatus.CAPTURED;
  if (["failure", "expired", "reversed", "canceled"].includes(normalized)) return PaymentStatus.FAILED;
  return PaymentStatus.PENDING;
};

export const POST = async (request: Request) => {
  const signature = request.headers.get("x-sign") || "";
  const publicKey = process.env.MONOBANK_WEBHOOK_PUBLIC_KEY || "";
  const rawBody = await request.text();

  if (!signature || !publicKey) {
    return NextResponse.json({ error: "Signature missing." }, { status: 400 });
  }

  const isValid = verifyMonobankSignature(rawBody, signature, publicKey);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const invoiceId = payload?.invoiceId || payload?.invoice?.invoiceId || null;
  const reference = payload?.reference || payload?.merchantPaymInfo?.reference || null;
  const status = mapStatus(payload?.status || payload?.invoice?.status);

  const payment = invoiceId
    ? await prisma.payment.findFirst({ where: { provider: PaymentProvider.MONOBANK, providerPaymentId: invoiceId } })
    : null;

  const order = payment
    ? await prisma.order.findUnique({ where: { id: payment.orderId } })
    : reference
      ? await prisma.order.findUnique({ where: { id: reference } })
      : null;

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const ensuredPayment = payment
    ? payment
    : await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.MONOBANK,
          status: PaymentStatus.PENDING,
          amountMinor: order.totalMinor,
          currency: order.currency,
          providerPaymentId: invoiceId || undefined,
        },
      });

  await prisma.payment.update({
    where: { id: ensuredPayment.id },
    data: {
      status,
      providerPaymentId: invoiceId || undefined,
      raw: payload as any,
    },
  });

  if (status === PaymentStatus.CAPTURED && order.status !== OrderStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: OrderEventType.STATUS_CHANGE,
        message: "Payment confirmed (Monobank)",
        metadata: { status: payload?.status },
      },
    });
  }

  return NextResponse.json({ ok: true });
};
