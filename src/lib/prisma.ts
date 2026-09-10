import { PrismaClient } from "@prisma/client";

// the Vercel Neon integration may inject the URL under a custom prefix
process.env.DATABASE_URL ||= process.env.DATABASE1_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
