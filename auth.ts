import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export const authOptions: any = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Please enter both email/username and password.");
        }

        const identifier = credentials.identifier.trim().toLowerCase();
        
        // Find user by either email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
        }).catch(() => null);

        if (!user || !user.passwordHash) {
          throw new Error("No user found with the provided credentials.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password. Please try again.");
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "sticker-studio-secret-jwt-key-321",
};

export default authOptions;
