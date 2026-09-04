import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { memoryUsers } from "@/lib/memory-store";

// Next.js App Router compatible JSON response helper
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
    const body = await req.json();
    const { email, username, password } = body;

    // Validate presence of required fields
    if (!email || !username || !password) {
      return jsonResponse(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Basic format validation
    if (password.length < 6) {
      return jsonResponse(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return jsonResponse(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Check if email or username is already taken in memory fallback
    for (const memUser of memoryUsers.values()) {
      if (memUser.email === cleanEmail) {
        return jsonResponse(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      if (memUser.username === cleanUsername) {
        return jsonResponse(
          { error: "This username is already claimed." },
          { status: 409 }
        );
      }
    }

    // Check if email or username is already taken in Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      },
    }).catch((err) => {
      console.warn("Prisma findFirst warning, proceeding:", err?.message);
      return null;
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return jsonResponse(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return jsonResponse(
        { error: "This username is already claimed." },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let newUser: { id: string; email: string; username: string; createdAt: Date };
    try {
      // Create the new User in PostgreSQL via Prisma
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          passwordHash,
        },
      });
    } catch (createErr: any) {
      if (createErr.code === "P2002") {
        const target = (createErr.meta?.target as string[]) || [];
        const isEmail = target.some((t: string) => t.includes("email"));
        return jsonResponse(
          { error: isEmail ? "An account with this email already exists." : "This username is already claimed." },
          { status: 409 }
        );
      }
      console.warn("Prisma user creation unavailable, falling back to memory store:", createErr?.message);
      const fallbackId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const memUser = {
        id: fallbackId,
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        createdAt: new Date(),
      };
      memoryUsers.set(fallbackId, memUser);
      newUser = memUser;
    }

    return jsonResponse(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          createdAt: newUser.createdAt,
        },
        token: newUser.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return jsonResponse(
      { error: error?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
