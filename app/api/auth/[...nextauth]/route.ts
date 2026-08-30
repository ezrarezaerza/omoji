import { authOptions } from "@/auth";

// NextAuth API Route Handler for Next.js App Router
// In standard Next.js App Router with NextAuth v4/v5:
// import NextAuth from "next-auth";
// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

export async function GET(request: Request) {
  return new Response(JSON.stringify({ status: "NextAuth Endpoint Ready" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return new Response(
      JSON.stringify({
        message: "NextAuth handler processing credentials...",
        data: body,
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
