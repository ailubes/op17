import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getS3Client, getS3Config } from "@/lib/s3";
import { getRouteParam, RouteContext } from "@/lib/route-context";

export const DELETE = async (_request: Request, context: RouteContext) => {
  const session = await requireAdminSession(_request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mediaId = await getRouteParam(context, "id");
  if (!mediaId) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  await prisma.media.delete({ where: { id: mediaId } });

  try {
    getS3Config();
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: media.bucket,
        Key: media.objectKey,
      })
    );
  } catch {
    // Best-effort delete; ignore storage errors.
  }

  return NextResponse.json({ data: mediaId });
};
