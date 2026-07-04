import "dotenv/config";
import { prisma } from "../src/db";
import { hashPassword } from "../src/services/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@firstassist.local";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      role: "ADMIN",
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Created admin user: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
