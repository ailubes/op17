import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { OrderEventType } from "@prisma/client";
import { getRouteParam, RouteContext } from "@/lib/route-context";
import { logOrderNoteAdded } from "@/lib/audit";

export const POST = async (request: Request, context: RouteContext) => {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getRouteParam(context, "id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json({ error: "Note is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
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

  // Log order note added
  await logOrderNoteAdded(
    session.userId,
    order.id,
    order.orderNumber,
    note,
    request
  );

  return NextResponse.json({ data: event }, { status: 201 });
};

