import { PrismaClient } from "@prisma/client";

// the Neon store is injected under the custom prefix DATABASE1 (full names:
// DATABASE1_DATABASE_URL etc.) — prefer it, so another integration's plain
// DATABASE_URL can't hijack the app
const neonUrl =
  process.env.DATABASE1_DATABASE_URL ||
  process.env.DATABASE1_POSTGRES_PRISMA_URL ||
  process.env.DATABASE1_URL;
if (neonUrl) process.env.DATABASE_URL = neonUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
