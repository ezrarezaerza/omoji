import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { memoryUsers } from "@/lib/memory-store";

// JSON Response helper
const jsonResponse = (data: any, init?: { status?: number; headers?: Record<string, string> }) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = (body.email || body.username || body.identifier || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return jsonResponse(
        { error: "Please provide your email/username and password." },
        { status: 400 }
      );
    }

    // First try Prisma PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    }).catch((err) => {
      console.warn("Prisma query error in /api/auth/login:", err?.message);
      return null;
    });

    // If not found in Prisma, check memory store fallback
    if (!user) {
      for (const memUser of memoryUsers.values()) {
        if (memUser.email.toLowerCase() === identifier || memUser.username.toLowerCase() === identifier) {
          user = memUser as any;
          break;
        }
      }
    }

    if (!user) {
      return jsonResponse(
        { error: "No account found with this email or username." },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return jsonResponse(
        { error: "Invalid account configuration. Please reset your credentials." },
        { status: 401 }
      );
    }

    // Validate password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return jsonResponse(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };

    return jsonResponse(
      {
        message: "Login successful",
        user: safeUser,
        token: user.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login route error:", error);
    return jsonResponse(
      { error: error?.message || "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
