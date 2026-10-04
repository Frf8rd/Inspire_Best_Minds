import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./src/config/database.js";

// Doar pentru dezvoltare locală. Parola implicită NU trebuie folosită în producție.
const DEV_PASSWORD = process.env.SEED_PASSWORD || "Test1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  const institution = await prisma.institution.upsert({
    where: { slug: "serviciul-infrastructura" },
    update: {},
    create: {
      name: "Serviciul de Infrastructură",
      slug: "serviciul-infrastructura",
      type: "MUNICIPAL_SERVICE",
      contactEmail: "infrastructura@urbanpulse.md",
    },
  });

  const department = await prisma.department.upsert({
    where: { institutionId_name: { institutionId: institution.id, name: "Drumuri" } },
    update: {},
    create: { institutionId: institution.id, name: "Drumuri" },
  });

  const category = await prisma.category.upsert({
    where: { slug: "drumuri-si-gropi" },
    update: {},
    create: {
      name: "Drumuri și gropi",
      slug: "drumuri-si-gropi",
      description: "Probleme legate de drumuri, gropi și asfalt.",
    },
  });

  await prisma.routingRule.upsert({
    where: { categoryId_departmentId: { categoryId: category.id, departmentId: department.id } },
    update: {},
    create: { categoryId: category.id, departmentId: department.id },
  });

  const citizen = await prisma.user.upsert({
    where: { email: "citizen@urbanpulse.md" },
    update: {},
    create: { name: "Test Citizen", email: "citizen@urbanpulse.md", passwordHash, role: "CITIZEN" },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@urbanpulse.md" },
    update: {},
    create: { name: "Test Staff", email: "staff@urbanpulse.md", passwordHash, role: "STAFF" },
  });

  await prisma.membership.upsert({
    where: { userId_institutionId: { userId: staff.id, institutionId: institution.id } },
    update: {},
    create: {
      userId: staff.id,
      institutionId: institution.id,
      departmentId: department.id,
      role: "MANAGER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@urbanpulse.md" },
    update: {},
    create: { name: "Test Admin", email: "admin@urbanpulse.md", passwordHash, role: "ADMIN" },
  });

  console.log("Seed OK:", {
    citizen: citizen.email,
    staff: staff.email,
    admin: admin.email,
    password: DEV_PASSWORD,
    categoryId: category.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
