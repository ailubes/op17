import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireUserManagement,
  jsonResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
} from "@/lib/guards";
import { logUserDeactivated, logUserReactivated } from "@/lib/audit";

// PATCH /api/admin/users/[id]/status - Activate/deactivate user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserManagement(request);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isActive, reason } = body;

    if (typeof isActive !== "boolean") {
      return badRequestResponse("isActive (boolean) is required");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return notFoundResponse("User");
    }

    // Cannot deactivate own account
    if (id === session.userId) {
      return jsonResponse(
        { error: "Cannot deactivate your own account" },
        403
      );
    }

    // If status hasn't changed, return early
    if (existingUser.isActive === isActive) {
      return jsonResponse({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          isActive: existingUser.isActive,
        },
      });
    }

    // Update user status
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    // If deactivating, revoke all sessions
    if (!isActive) {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    // Log the status change
    if (isActive) {
      await logUserReactivated(session.userId, id, request);
    } else {
      await logUserDeactivated(session.userId, id, reason, request);
    }

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return jsonResponse({ error: "Failed to update user status" }, 500);
  }
}
