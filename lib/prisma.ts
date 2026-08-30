import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Creates an instance of PrismaClient configured for PostgreSQL / Prisma Postgres on Vercel
 * Supports Prisma Accelerate connection strings as well as standard pooled postgresql:// URLs.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (databaseUrl && (databaseUrl.startsWith("prisma://") || databaseUrl.includes("accelerate.prisma-data.net"))) {
    return (basePrisma.$extends(withAccelerate()) as unknown) as PrismaClient;
  }

  return basePrisma;
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
