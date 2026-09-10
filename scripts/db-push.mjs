// Sync the Prisma schema before build.
// Picks the Neon (DATABASE1_*) env first, preferring the unpooled URL for DDL;
// when nothing is in the process env (local dev), prisma reads .env itself.
import { spawnSync } from "node:child_process";

const url =
  process.env.DATABASE1_DATABASE_URL_UNPOOLED ||
  process.env.DATABASE1_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE1_DATABASE_URL ||
  process.env.DATABASE1_URL_UNPOOLED ||
  process.env.DATABASE1_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "";

const env = { ...process.env };
if (url) env.DATABASE_URL = url;
else delete env.DATABASE_URL; // let prisma load it from .env

const res = spawnSync(
  "npx",
  ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"],
  { stdio: "inherit", env }
);
process.exit(res.status ?? 1);
