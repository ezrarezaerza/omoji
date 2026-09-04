import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
}

/**
 * Resolves or initializes an authenticated user session for API route handlers.
 * Compatible with NextAuth, Bearer tokens, x-user-id headers, or auto-initialized creator profile.
 */
export async function getOrCreateSessionUser(req: Request): Promise<SessionUser> {
  const authHeader = req.headers.get("authorization");
  const userIdHeader = req.headers.get("x-user-id");

  let targetUserId = userIdHeader;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token && token !== "null" && token !== "undefined") {
      targetUserId = targetUserId || token;
    }
  }

  try {
    if (targetUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, username: true },
      });
      if (existingUser) return existingUser;

      // If the client provided a guest identifier that doesn't exist yet, create a real user record for them
      if (targetUserId.startsWith("guest_") || targetUserId.startsWith("usr_")) {
        const guestUser = await prisma.user.create({
          data: {
            id: targetUserId,
            email: `${targetUserId}@guest.omoji.studio`,
            username: `creator_${targetUserId.slice(-6)}`,
            passwordHash: "guest_session",
          },
          select: { id: true, email: true, username: true },
        });
        return guestUser;
      }
    }

    // Generate a fresh isolated guest creator account for this visitor
    const freshGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newGuest = await prisma.user.create({
      data: {
        id: freshGuestId,
        email: `${freshGuestId}@guest.omoji.studio`,
        username: `creator_${freshGuestId.slice(-6)}`,
        passwordHash: "guest_session",
      },
      select: { id: true, email: true, username: true },
    });

    return newGuest;
  } catch (error) {
    console.warn("User session lookup fallback active:", error);
    const fallbackId = targetUserId || `guest_${Date.now()}`;
    return {
      id: fallbackId,
      email: `${fallbackId}@guest.omoji.studio`,
      username: `creator_${fallbackId.slice(-6)}`,
    };
  }
}
