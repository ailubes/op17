import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liqpayEncodeData, liqpaySignature } from "@/lib/payments.liqpay";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "LiqPay keys are not configured." }, { status: 500 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  const amount = Number((order.totalMinor / 100).toFixed(2));
  const payload = {
    public_key: publicKey,
    version: "3",
    action: "pay",
    amount,
    currency: order.currency,
    description: `Order ${order.orderNumber}`,
    order_id: order.orderNumber,
    server_url: process.env.LIQPAY_WEBHOOK_URL || undefined,
    result_url: process.env.LIQPAY_RETURN_URL || undefined,
  };

  const data = liqpayEncodeData(payload);
  const signature = liqpaySignature(privateKey, data);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerInvoiceId: payload.order_id,
      raw: payload as any,
    },
  });

  return NextResponse.json({
    url: "https://www.liqpay.ua/api/3/checkout",
    data,
    signature,
  });
};
