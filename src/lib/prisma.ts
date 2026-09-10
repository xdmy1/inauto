import { PrismaClient } from "@prisma/client";

// the Neon store is injected under the custom prefix DATABASE1 — prefer it,
// so a stray storage integration's DATABASE_URL can't hijack the app
if (process.env.DATABASE1_URL) {
  process.env.DATABASE_URL = process.env.DATABASE1_URL;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
