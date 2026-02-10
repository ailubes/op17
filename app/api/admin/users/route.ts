import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  requireUserManagement,
  jsonResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/lib/guards";
import {
  logUserCreated,
  logPasswordResetLink,
  logUserInviteLink,
} from "@/lib/audit";
import { RoleName } from "@/lib/permissions";

// GET /api/admin/users - List all users with their roles
export async function GET(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") as RoleName | null;
    const status = searchParams.get("status"); // "active", "inactive", "all"

    const where: Record<string, unknown> = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Role filter
    let users;
    if (roleFilter) {
      users = await prisma.user.findMany({
        where: {
          ...where,
          roles: {
            some: {
              role: {
                name: roleFilter,
              },
            },
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      users = await prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Get last login for each user
    const userIds = users.map((u) => u.id);
    const lastSessions = await prisma.session.findMany({
      where: {
        userId: { in: userIds },
      },
      orderBy: { createdAt: "desc" },
      distinct: ["userId"],
      select: {
        userId: true,
        createdAt: true,
      },
    });

    const lastLoginMap = new Map(
      lastSessions.map((s) => [s.userId, s.createdAt])
    );

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((r) => r.role.name),
      lastLogin: lastLoginMap.get(user.id) || null,
      activeSessions: user._count.sessions,
    }));

    return jsonResponse({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return jsonResponse({ error: "Failed to fetch users" }, 500);
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { email, name, password, roles, sendInvite } = body;

    // Validation
    if (!email) {
      return badRequestResponse("Email is required");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return badRequestResponse("User with this email already exists");
    }

    // Validate roles
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return badRequestResponse("At least one role is required");
    }

    // Only ADMIN can assign ADMIN role
    const isActorAdmin = session.user.roles.some(
      (r) => r.role.name === "ADMIN"
    );
    if (!isActorAdmin && roles.includes("ADMIN")) {
      return jsonResponse({ error: "Only admins can assign admin role" }, 403);
    }

    // Get role IDs
    const roleRecords = await prisma.role.findMany({
      where: {
        name: { in: roles },
      },
    });

    if (roleRecords.length !== roles.length) {
      return badRequestResponse("One or more invalid roles");
    }

    // Generate password or use provided
    let passwordHash: string;
    let tempPassword: string | undefined;

    if (password) {
      passwordHash = await hash(password, 12);
    } else {
      // Generate temporary password
      tempPassword = randomBytes(8).toString("hex");
      passwordHash = await hash(tempPassword, 12);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isActive: true,
        roles: {
          create: roleRecords.map((role) => ({
            role: {
              connect: { id: role.id },
            },
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log the creation
    await logUserCreated(
      session.userId,
      user.id,
      email,
      roles,
      request
    );

    // Generate reset token if sendInvite is true
    let inviteLink: string | undefined;
    if (sendInvite) {
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
      });

      inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

      await logUserInviteLink(session.userId, user.id, email, request);
    }

    return jsonResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          roles: user.roles.map((r) => r.role.name),
          createdAt: user.createdAt,
        },
        tempPassword: sendInvite ? undefined : tempPassword,
        inviteLink,
      },
      201
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return jsonResponse({ error: "Failed to create user" }, 500);
  }
}
