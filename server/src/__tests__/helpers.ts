import { prisma } from "../lib/prisma.js";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AuditLog", "Donation", "Expense", "Fund", "RefreshToken", "User", "Organization" RESTART IDENTITY CASCADE;',
  );
}
