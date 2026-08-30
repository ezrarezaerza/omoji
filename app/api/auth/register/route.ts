import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

    // Check if email or username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        username: cleanUsername,
      },
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
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the new User in PostgreSQL via Prisma
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
      },
    });

    return jsonResponse(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          createdAt: newUser.createdAt,
        },
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
