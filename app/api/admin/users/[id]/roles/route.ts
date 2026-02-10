import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireUserManagement,
  jsonResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
} from "@/lib/guards";
import { logUserRolesUpdated } from "@/lib/audit";

// PATCH /api/admin/users/[id]/roles - Update user roles
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
    const { roles } = body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return badRequestResponse("At least one role is required");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!existingUser) {
      return notFoundResponse("User");
    }

    // Cannot modify own roles (prevent self-lockout)
    if (id === session.userId) {
      return jsonResponse(
        { error: "Cannot modify your own roles" },
        403
      );
    }

    // Only ADMIN can assign ADMIN role
    const isActorAdmin = session.user.roles.some(
      (r) => r.role.name === "ADMIN"
    );
    if (!isActorAdmin && roles.includes("ADMIN")) {
      return jsonResponse(
        { error: "Only admins can assign admin role" },
        403
      );
    }

    // Get current roles
    const oldRoles = existingUser.roles.map((r) => r.role.name);

    // If roles haven't changed, return early
    const rolesChanged =
      oldRoles.length !== roles.length ||
      !oldRoles.every((r) => roles.includes(r));

    if (!rolesChanged) {
      return jsonResponse({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          roles: oldRoles,
        },
      });
    }

    // Get role records
    const roleRecords = await prisma.role.findMany({
      where: {
        name: { in: roles },
      },
    });

    if (roleRecords.length !== roles.length) {
      return badRequestResponse("One or more invalid roles");
    }

    // Update roles (delete old, create new)
    await prisma.$transaction([
      // Delete existing roles
      prisma.userRole.deleteMany({
        where: { userId: id },
      }),
      // Create new roles
      prisma.userRole.createMany({
        data: roleRecords.map((role) => ({
          userId: id,
          roleId: role.id,
        })),
      }),
    ]);

    // Log the role change
    await logUserRolesUpdated(session.userId, id, oldRoles, roles, request);

    // Return updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return jsonResponse({
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        roles: updatedUser!.roles.map((r) => r.role.name),
      },
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    return jsonResponse({ error: "Failed to update user roles" }, 500);
  }
}
