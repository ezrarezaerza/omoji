import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.includes("/session")) {
    const authHeader = request.headers.get("authorization");
    const userIdHeader = request.headers.get("x-user-id");
    let userId = userIdHeader;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, createdAt: true },
      }).catch(() => null);

      if (user) {
        return new Response(JSON.stringify({ user, expires: new Date(Date.now() + 30 * 86400000).toISOString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (path.includes("/csrf")) {
    return new Response(JSON.stringify({ csrfToken: "omoji_csrf_token_" + Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (path.includes("/providers")) {
    return new Response(
      JSON.stringify({
        credentials: {
          id: "credentials",
          name: "Credentials",
          type: "credentials",
          signinUrl: "/api/auth/signin/credentials",
          callbackUrl: "/api/auth/callback/credentials",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ status: "NextAuth Endpoint Ready" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ error: "Missing email/username or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    }).catch(() => null);

    if (!user || !user.passwordHash) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        token: user.id,
        url: "/",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

