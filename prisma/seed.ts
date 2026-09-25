import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EXPENSE_CATEGORIES = [
  "Electricity",
  "Gas",
  "Water",
  "Internet",
  "Cleaning",
  "Equipment",
  "Supplies",
  "Maintenance",
  "Insurance",
  "Marketing",
  "Repairs",
  "Miscellaneous",
];

async function main() {
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL ?? "admin@yourplatform.com";
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_PLATFORM_ADMIN_NAME ?? "Platform Admin";

  const existingAdmin = await prisma.platformAdmin.findUnique({ where: { email } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.platformAdmin.create({
      data: { email, passwordHash, name, role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    console.log(`Created platform admin: ${email}`);
  } else {
    console.log(`Platform admin already exists: ${email}`);
  }

  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    const existing = await prisma.expenseCategory.findFirst({ where: { name, isGlobalDefault: true } });
    if (!existing) {
      await prisma.expenseCategory.create({ data: { name, isGlobalDefault: true } });
    }
  }
  console.log("Ensured default expense categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
