import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestLocale } from "@/lib/locale";
import { getPublicObjectUrl } from "@/lib/s3";
import { CollectionStatus, Locale, SaleMode } from "@prisma/client";

const toDbLocale = (locale: string) => {
  if (locale === "uk") return Locale.uk;
  if (locale === "it") return Locale.it;
  return Locale.en;
};

export const GET = async (request: Request) => {
  const locale = getRequestLocale(request);
  const dbLocale = toDbLocale(locale);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: {
        include: {
          translations: {
            where: { locale: { in: [dbLocale, Locale.en] } },
          },
        },
      },
      collection: {
        include: {
          translations: {
            where: { locale: { in: [dbLocale, Locale.en] } },
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      media: { orderBy: { sortOrder: "asc" } },
      translations: {
        where: { locale: { in: [dbLocale, Locale.en] } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = products
    .filter((product) => {
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
    })
    .map((product) => {
      const translation =
        product.translations.find((entry) => entry.locale === dbLocale) ||
        product.translations.find((entry) => entry.locale === Locale.en);
      const categoryTranslation =
        product.category?.translations?.find((entry) => entry.locale === dbLocale) ||
        product.category?.translations?.find((entry) => entry.locale === Locale.en);
      const collectionTranslation =
        product.collection?.translations?.find((entry) => entry.locale === dbLocale) ||
        product.collection?.translations?.find((entry) => entry.locale === Locale.en);

      return {
        ...product,
        name: translation?.name || product.name,
        description: translation?.description || product.description,
        type: translation?.type || product.type,
        gender: translation?.gender || product.gender,
        sport: translation?.sport || product.sport,
        media: product.media.map((item) => ({
          ...item,
          url: getPublicObjectUrl(item.bucket, item.objectKey),
        })),
        category: product.category
          ? {
              ...product.category,
              name: categoryTranslation?.name || product.category.name,
            }
          : null,
        collection: product.collection
          ? {
              ...product.collection,
              name: collectionTranslation?.name || product.collection.name,
              description: collectionTranslation?.description || product.collection.description,
            }
          : null,
      };
    });

  return NextResponse.json({ data: filtered });
};
