import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollectionStatus, SaleMode } from "@prisma/client";

export const GET = async () => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
      collection: true,
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      media: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = products.filter((product) => {
    if (!product.collection) {
      return true;
    }

    if (!product.collection.isVisible) {
      return false;
    }

    if (product.collection.saleMode === SaleMode.ALWAYS_ON) {
      return true;
    }

    return product.collection.status === CollectionStatus.LIVE;
  });

  return NextResponse.json({ data: filtered });
};
