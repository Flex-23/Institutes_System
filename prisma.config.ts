import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// إعداد Prisma 7 — رابط قاعدة البيانات ينتقل من schema.prisma إلى هنا.
// يُستخدم من قبل أوامر الترحيل (migrate) والمزامنة (db push) والبذر (seed).
// وقت التشغيل، يستخدم PrismaClient محوّل التعريف (driver adapter) — انظر lib/prisma.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
