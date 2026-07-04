import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/services/auth";

export const TEST_ADMIN_EMAIL = "admin@test.local";
export const TEST_ADMIN_PASSWORD = "test-password-123";

export default async function setup() {
  const prisma = new PrismaClient();

  const tables = [
    "Attachment",
    "Report",
    "QuoteItem",
    "Issue",
    "ChecklistAnswer",
    "ChecklistResult",
    "InspectionFormField",
    "InspectionForm",
    "Part",
    "Job",
    "MaintenanceSchedule",
    "Asset",
    "Site",
    "Client",
    "User",
  ];
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );

  await prisma.user.create({
    data: {
      name: "Test Admin",
      email: TEST_ADMIN_EMAIL,
      role: "ADMIN",
      passwordHash: await hashPassword(TEST_ADMIN_PASSWORD),
    },
  });

  await prisma.$disconnect();
}
