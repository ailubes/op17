import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liqpayDecodeData, liqpayVerifySignature } from "@/lib/payments.liqpay";
import { OrderEventType, OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";

const mapStatus = (status?: string | null) => {
  if (!status) return PaymentStatus.PENDING;
  const normalized = status.toLowerCase();
  if (["success", "sandbox"].includes(normalized)) return PaymentStatus.CAPTURED;
  if (["failure", "error", "reversed"].includes(normalized)) return PaymentStatus.FAILED;
  return PaymentStatus.PENDING;
};

export const POST = async (request: Request) => {
  const body = await request.formData().catch(() => null);
  const data = body?.get("data")?.toString() || "";
  const signature = body?.get("signature")?.toString() || "";

  if (!data || !signature) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: "LiqPay private key missing." }, { status: 500 });
  }

  const isValid = liqpayVerifySignature(privateKey, data, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = liqpayDecodeData(data);
  const orderNumber = payload?.order_id;
  const paymentId = payload?.payment_id || payload?.transaction_id || null;
  const status = mapStatus(payload?.status);

  if (!orderNumber) {
    return NextResponse.json({ error: "order_id missing." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber },
    include: { payments: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const payment =
    order.payments.find((entry) => entry.provider === PaymentProvider.LIQPAY) ||
    (await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.LIQPAY,
        status: PaymentStatus.PENDING,
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
    }));

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      providerPaymentId: paymentId || undefined,
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
        message: "Payment confirmed (LiqPay)",
        metadata: { status: payload?.status },
      },
    });
  }

  return NextResponse.json({ ok: true });
};
