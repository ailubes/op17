import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  requireUserManagement,
  jsonResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/guards";
import { logPasswordResetLink } from "@/lib/audit";

// POST /api/admin/users/[id]/reset-password - Generate password reset link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserManagement(request);
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return notFoundResponse("User");
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await prisma.user.update({
      where: { id },
      data: { resetToken, resetTokenExpires },
    });

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Log the action
    await logPasswordResetLink(session.userId, id, request);

    return jsonResponse({
      resetLink,
      expiresAt: resetTokenExpires,
    });
  } catch (error) {
    console.error("Error generating reset link:", error);
    return jsonResponse({ error: "Failed to generate reset link" }, 500);
  }
}
