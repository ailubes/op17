import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getS3Config, getPublicObjectUrl } from "@/lib/s3";

const getEntityWhere = (entityType: string, entityId: string) => {
  if (entityType === "product") return { productId: entityId };
  if (entityType === "variant") return { variantId: entityId };
  if (entityType === "collection") return { collectionId: entityId };
  return null;
};

export const POST = async (request: Request) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const entityType = typeof body.entityType === "string" ? body.entityType : "";
  const entityId = typeof body.entityId === "string" ? body.entityId : "";
  const objectKey = typeof body.objectKey === "string" ? body.objectKey : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : null;
  const widthValue = body.width !== undefined ? Number(body.width) : null;
  const heightValue = body.height !== undefined ? Number(body.height) : null;
  const width = Number.isFinite(widthValue) ? widthValue : null;
  const height = Number.isFinite(heightValue) ? heightValue : null;
  const alt = typeof body.alt === "string" ? body.alt.trim() : null;
  const sortOrderValue = body.sortOrder !== undefined ? Number(body.sortOrder) : null;
  const sortOrder = Number.isFinite(sortOrderValue) ? sortOrderValue : null;

  if (!["product", "variant", "collection"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid entity type." }, { status: 400 });
  }

  if (!entityId || !objectKey) {
    return NextResponse.json({ error: "entityId and objectKey are required." }, { status: 400 });
  }

  let config: ReturnType<typeof getS3Config>;
  try {
    config = getS3Config();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const relation = getEntityWhere(entityType, entityId);
  if (!relation) {
    return NextResponse.json({ error: "Invalid entity type." }, { status: 400 });
  }

  const currentMax = await prisma.media.aggregate({
    where: relation,
    _max: { sortOrder: true },
  });
  const nextSortOrder = sortOrder ?? (currentMax._max.sortOrder ?? -1) + 1;

  const media = await prisma.media.create({
    data: {
      ...relation,
      bucket: config.bucket,
      objectKey,
      mimeType,
      width,
      height,
      alt,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json({
    data: {
      ...media,
      url: getPublicObjectUrl(media.bucket, media.objectKey),
    },
  });
};
