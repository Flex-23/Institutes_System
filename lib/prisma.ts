import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Prisma 7 يتطلب محوّل تعريف (driver adapter) للاتصال المباشر بقاعدة البيانات.
// نستخدم محوّل MariaDB الذي يتصل بخوادم MySQL (بما فيها MySQL في XAMPP).
// رابط الاتصال يُقرأ من DATABASE_URL (يُحمّله Next.js تلقائياً من ملف .env).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "المتغيّر DATABASE_URL غير مُعرّف. انسخ .env.example إلى .env وحدّد رابط قاعدة البيانات."
    );
  }
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
