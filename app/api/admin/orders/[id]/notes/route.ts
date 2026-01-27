import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { OrderEventType } from "@prisma/client";

export const POST = async (request: Request, context: { params: { id: string } }) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json({ error: "Note is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: context.params.id } });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const event = await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: OrderEventType.NOTE,
      message: note,
      createdById: session.userId,
    },
    include: { createdBy: true },
  });

  return NextResponse.json({ data: event }, { status: 201 });
};

