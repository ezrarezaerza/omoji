import { prisma } from "@/lib/prisma";
import { memoryUsers } from "@/lib/memory-store";

const jsonResponse = (data: any, init?: { status?: number; headers?: Record<string, string> }) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");

    let userId = userIdHeader;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }

    if (!userId || userId === "null" || userId === "undefined") {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    }).catch(() => null);

    if (!user && memoryUsers.has(userId)) {
      const mem = memoryUsers.get(userId)!;
      user = {
        id: mem.id,
        email: mem.email,
        username: mem.username,
        createdAt: mem.createdAt,
      };
    }

    if (!user) {
      return jsonResponse({ error: "User session not found" }, { status: 404 });
    }

    return jsonResponse({ user }, { status: 200 });
  } catch (error: any) {
    return jsonResponse(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
