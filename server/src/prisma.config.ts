// Pune acest fișier în rădăcina folderului server/ (lângă package.json).
// Prisma 7: URL-ul bazei de date stă aici, nu în schema.prisma.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});