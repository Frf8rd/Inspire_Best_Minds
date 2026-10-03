import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export async function createProblem({
  userId,
  title,
  categoryId,
  description,
  latitude,
  longitude,
}) {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      service: true,
    },
  });

  if (!category) {
    throw new Error("Categoria nu există.");
  }

  const problem = await prisma.problem.create({
    data: {
      code: "TEMP",
      utilizatorId: userId,
      categorieId: categoryId,
      serviciuId: category.serviciuId,
      titlu: title,
      descriere: description,
      latitudine: latitude,
      longitudine: longitude,
    },
  });

  const code = `#UP-${String(problem.id).padStart(4, "0")}`;

  const updatedProblem = await prisma.problem.update({
    where: {
      id: problem.id,
    },
    data: {
      code,
    },
  });

  await prisma.statusHistory.create({
    data: {
      problemaId: updatedProblem.id,
      status: updatedProblem.status,
      utilizatorId: userId,
      comentariu: "Sesizarea a fost creată.",
    },
  });

  return updatedProblem;
}
