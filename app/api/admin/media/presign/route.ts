import { NextResponse } from "next/server";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getPublicObjectUrl, getS3Client, getS3Config } from "@/lib/s3";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const sanitizeFileName = (value: string, contentType: string) => {
  const base = value.split(/[\\/]/).pop() || "image";
  const safeBase = base.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  if (safeBase.includes(".")) return safeBase;
  const ext = EXTENSIONS[contentType] || "jpg";
  return `${safeBase}.${ext}`;
};

const ensureEntity = async (entityType: string, entityId: string) => {
  if (entityType === "product") {
    return prisma.product.findUnique({ where: { id: entityId } });
  }
  if (entityType === "variant") {
    return prisma.variant.findUnique({ where: { id: entityId } });
  }
  if (entityType === "collection") {
    return prisma.collection.findUnique({ where: { id: entityId } });
  }
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
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";

  if (!["product", "variant", "collection"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid entity type." }, { status: 400 });
  }

  if (!entityId || !fileName || !contentType) {
    return NextResponse.json({ error: "entityId, fileName, and contentType are required." }, { status: 400 });
  }

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const entityExists = await ensureEntity(entityType, entityId);
  if (!entityExists) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 });
  }

  let config: ReturnType<typeof getS3Config>;
  try {
    config = getS3Config();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const safeName = sanitizeFileName(fileName, contentType);
  const objectKey = `${entityType}s/${entityId}/${crypto.randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
  const publicUrl = getPublicObjectUrl(config.bucket, objectKey);

  return NextResponse.json({
    uploadUrl,
    objectKey,
    bucket: config.bucket,
    publicUrl,
  });
};
