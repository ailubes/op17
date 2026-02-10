import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  requireUserManagement,
  jsonResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
} from "@/lib/guards";
import { logUserUpdated } from "@/lib/audit";

// GET /api/admin/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserManagement(request);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return notFoundResponse("User");
    }

    // Get last login
    const lastSession = await prisma.session.findFirst({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roles.map((r) => r.role.name),
        lastLogin: lastSession?.createdAt || null,
        activeSessions: user._count.sessions,
        orderCount: user._count.orders,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return jsonResponse({ error: "Failed to fetch user" }, 500);
  }
}

// PATCH /api/admin/users/[id] - Update user details
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
    const { name, phone, password } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!existingUser) {
      return notFoundResponse("User");
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};
    const updateData: Record<string, unknown> = {};

    if (name !== undefined && name !== existingUser.name) {
      updateData.name = name;
      changes.name = { from: existingUser.name, to: name };
    }

    if (phone !== undefined && phone !== existingUser.phone) {
      updateData.phone = phone;
      changes.phone = { from: existingUser.phone, to: phone };
    }

    if (password) {
      updateData.passwordHash = await hash(password, 12);
      changes.password = "updated";
    }

    // If no changes, return early
    if (Object.keys(updateData).length === 0) {
      return jsonResponse({ user: existingUser });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log the update
    await logUserUpdated(session.userId, id, changes, request);

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        roles: user.roles.map((r) => r.role.name),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return jsonResponse({ error: "Failed to update user" }, 500);
  }
}
