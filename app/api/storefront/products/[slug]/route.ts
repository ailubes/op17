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

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;
  const locale = getRequestLocale(request);
  const dbLocale = toDbLocale(locale);

  const product = await prisma.product.findUnique({
    where: {
      slug,
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
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Check collection visibility and sale mode
  if (product.collection) {
    if (!product.collection.isVisible) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.collection.saleMode !== SaleMode.ALWAYS_ON) {
      if (product.collection.status !== CollectionStatus.LIVE) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }
  }

  // Apply translations
  const translation =
    product.translations.find((entry) => entry.locale === dbLocale) ||
    product.translations.find((entry) => entry.locale === Locale.en);
  const categoryTranslation =
    product.category?.translations?.find((entry) => entry.locale === dbLocale) ||
    product.category?.translations?.find((entry) => entry.locale === Locale.en);
  const collectionTranslation =
    product.collection?.translations?.find((entry) => entry.locale === dbLocale) ||
    product.collection?.translations?.find((entry) => entry.locale === Locale.en);

  const data = {
    id: product.id,
    name: translation?.name || product.name,
    slug: product.slug,
    description: translation?.description || product.description,
    type: translation?.type || product.type,
    gender: translation?.gender || product.gender,
    sport: translation?.sport || product.sport,
    basePriceEur: product.basePriceEur,
    backorderPolicy: product.backorderPolicy,
    category: product.category
      ? {
          id: product.category.id,
          name: categoryTranslation?.name || product.category.name,
        }
      : null,
    collection: product.collection
      ? {
          id: product.collection.id,
          name: collectionTranslation?.name || product.collection.name,
          description: collectionTranslation?.description || product.collection.description,
          backorderPolicy: product.collection.backorderPolicy,
        }
      : null,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      priceEur: variant.priceEur,
      backorderPolicy: variant.backorderPolicy,
    })),
    media: product.media.map((item) => ({
      id: item.id,
      url: getPublicObjectUrl(item.bucket, item.objectKey),
      alt: item.alt,
    })),
  };

  return NextResponse.json({ data });
};
