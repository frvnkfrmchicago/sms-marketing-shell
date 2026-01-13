// Prisma 6 configuration file
// Connection URLs moved here as required by Prisma 6
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Vercel), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Primary URL (pooled connection for serverless)
    url: process.env["DATABASE_URL"]!,
    // Direct URL for migrations (bypasses connection pooler)
    // Vercel uses DATABASE_URL_UNPOOLED, Neon uses DIRECT_DATABASE_URL
    directUrl: process.env["DATABASE_URL_UNPOOLED"] || process.env["DIRECT_DATABASE_URL"],
  },
});
