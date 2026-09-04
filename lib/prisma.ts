import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Creates an instance of PrismaClient configured for PostgreSQL / Prisma Postgres on Vercel
 * Handles missing DATABASE_URL gracefully so serverless functions do not throw unhandled initialization exceptions.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.trim()) {
    // Provide a placeholder datasourceUrl to prevent Prisma client from throwing at instantiation
    return new PrismaClient({
      datasourceUrl: "postgresql://fallback:fallback@localhost:5432/omoji?connection_limit=1",
      log: ["error"],
    });
  }

  const basePrisma = new PrismaClient({
    log: ["error", "warn"],
  });

  if (databaseUrl.startsWith("prisma://") || databaseUrl.includes("accelerate.prisma-data.net")) {
    return (basePrisma.$extends(withAccelerate()) as unknown) as PrismaClient;
  }

  return basePrisma;
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
