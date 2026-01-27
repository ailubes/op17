import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toMonobankCurrency } from "@/lib/payments.monobank";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Monobank token missing." }, { status: 500 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const ccy = toMonobankCurrency(order.currency);
  if (ccy !== 980) {
    return NextResponse.json({ error: "Monobank supports only UAH." }, { status: 400 });
  }

  const payment =
    order.payments.find((entry) => entry.provider === PaymentProvider.MONOBANK) ||
    (await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MONOBANK,
        status: PaymentStatus.PENDING,
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
    }));

  const requestBody = {
    amount: order.totalMinor,
    ccy,
    merchantPaymInfo: {
      reference: order.id,
      destination: `Order ${order.orderNumber}`,
    },
    redirectUrl: process.env.MONOBANK_RETURN_URL || undefined,
    webHookUrl: process.env.MONOBANK_WEBHOOK_URL || undefined,
  };

  const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: "Monobank invoice failed.", details: text }, { status: 502 });
  }

  const invoice = await response.json();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: invoice.invoiceId || undefined,
      raw: invoice as any,
    },
  });

  return NextResponse.json({ data: invoice });
};
