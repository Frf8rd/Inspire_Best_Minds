import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "test@urbanpulse.md",
    },
    update: {},
    create: {
      nume: "Test User",
      email: "test@urbanpulse.md",
      parola: "test123",
      rol: "USER",
    },
  });

  const service = await prisma.municipalService.create({
    data: {
      denumire: "Serviciul de Infrastructură",
      contact: "infrastructura@urbanpulse.md",
    },
  });

  const category = await prisma.category.create({
    data: {
      denumire: "Drumuri și gropi",
      descriere: "Probleme legate de drumuri, gropi și asfalt.",
      serviciuId: service.id,
    },
  });

  console.log("Test data created:");
  console.log({
    userId: user.id,
    categoryId: category.id,
    serviceId: service.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
