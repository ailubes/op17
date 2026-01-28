import { NextResponse } from "next/server";
import { Prisma, Currency, OrderEventType, PaymentProvider, PaymentStatus, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { convertFromEur, toMinorUnits } from "@/lib/pricing";
import { randomBytes } from "crypto";

const generateOrderNumber = () => {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `OP17-${ymd}-${rand}`;
};

const resolveBackorderPolicy = (variant: any, product: any) => {
  return (
    variant?.backorderPolicy ||
    product?.backorderPolicy ||
    product?.collection?.backorderPolicy ||
    "DISALLOW"
  );
};

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const currency = Object.values(Currency).includes(body.currency) ? body.currency : Currency.EUR;
  const shippingMethod = Object.values(ShippingMethod).includes(body.shippingMethod)
    ? body.shippingMethod
    : ShippingMethod.NOVA_POST_BRANCH;

  const addressPayload = body.shippingAddress;
  if (!addressPayload || typeof addressPayload.name !== "string" || typeof addressPayload.city !== "string") {
    return NextResponse.json({ error: "Shipping address is required." }, { status: 400 });
  }

  const { cart } = await getOrCreateCart(request);
  const cartWithItems = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { collection: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cartWithItems || cartWithItems.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const subtotalEur = cartWithItems.items.reduce(
    (sum, item) => sum + item.unitPriceEur * item.quantity,
    0
  );
  const discountEur = 0;
  const shippingEur = 0;
  const totalEur = subtotalEur - discountEur + shippingEur;

  let fxRate: Prisma.Decimal | null = null;
  let totalMinor = toMinorUnits(totalEur, currency);

  if (currency !== Currency.EUR) {
    const rateRecord = await prisma.fxRate.findUnique({
      where: {
        baseCurrency_quoteCurrency: {
          baseCurrency: Currency.EUR,
          quoteCurrency: currency,
        },
      },
    });

    if (!rateRecord) {
      return NextResponse.json({ error: "FX rate missing." }, { status: 400 });
    }

    fxRate = rateRecord.rate;
    const converted = convertFromEur(totalEur, Number(rateRecord.rate));
    totalMinor = toMinorUnits(converted, currency);
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const provider = Object.values(PaymentProvider).includes(body.provider)
    ? body.provider
    : null;

  if (provider === PaymentProvider.MONOBANK && currency !== Currency.UAH) {
    return NextResponse.json({ error: "Monobank supports only UAH." }, { status: 400 });
  }

  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          name: String(addressPayload.name).trim(),
          phone: typeof addressPayload.phone === "string" ? addressPayload.phone.trim() : undefined,
          country: String(addressPayload.country || "Ukraine").trim(),
          region: typeof addressPayload.region === "string" ? addressPayload.region.trim() : undefined,
          city: String(addressPayload.city).trim(),
          postalCode: typeof addressPayload.postalCode === "string" ? addressPayload.postalCode.trim() : undefined,
          street1: String(addressPayload.street1 || "").trim(),
          street2: typeof addressPayload.street2 === "string" ? addressPayload.street2.trim() : undefined,
          novaPostOfficeId:
            typeof addressPayload.novaPostOfficeId === "string"
              ? addressPayload.novaPostOfficeId.trim()
              : undefined,
          novaPostOfficeName:
            typeof addressPayload.novaPostOfficeName === "string"
              ? addressPayload.novaPostOfficeName.trim()
              : undefined,
        },
      });

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: cartWithItems.userId ?? undefined,
          email,
          phone,
          status: "PENDING",
          currency,
          fxRate,
          subtotalEur,
          discountEur,
          shippingEur,
          totalEur,
          totalMinor,
          shippingAddressId: address.id,
          shippingMethod,
        },
      });

      await tx.orderItem.createMany({
        data: cartWithItems.items.map((item) => ({
          orderId: created.id,
          variantId: item.variantId,
          productName: item.variant.product.name,
          variantName: item.variant.name,
          sku: item.variant.sku,
          unitPriceEur: item.unitPriceEur,
          quantity: item.quantity,
          totalEur: item.unitPriceEur * item.quantity,
          attributes: {
            size: item.variant.size,
            color: item.variant.color,
          },
        })),
      });

      if (provider) {
        await tx.payment.create({
          data: {
            orderId: created.id,
            provider,
            status: PaymentStatus.PENDING,
            amountMinor: totalMinor,
            currency,
          },
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          type: OrderEventType.ORDER_CREATED,
          message: "Order created",
        },
      });

      for (const item of cartWithItems.items) {
        const policy = resolveBackorderPolicy(item.variant, item.variant.product);
        if (policy === "DISALLOW") {
          const updated = await tx.variant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Insufficient stock for ${item.variant.sku}`);
          }
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cartWithItems.id } });

      return created;
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 500 }
    );
  }
};

