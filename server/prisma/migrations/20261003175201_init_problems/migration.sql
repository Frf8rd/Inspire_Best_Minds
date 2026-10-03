-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('NOUA', 'IN_VERIFICARE', 'CONFIRMATA', 'REPARTIZATA', 'IN_LUCRU', 'REZOLVATA', 'RESPINSA', 'DUPLICAT', 'INFORMATII_INSUFICIENTE');

-- CreateEnum
CREATE TYPE "ProblemPriority" AS ENUM ('SCZUTA', 'MEDIE', 'RIDICATA', 'CRITICA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nume" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parola" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MunicipalService" (
    "id" SERIAL NOT NULL,
    "denumire" TEXT NOT NULL,
    "contact" TEXT,

    CONSTRAINT "MunicipalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "denumire" TEXT NOT NULL,
    "descriere" TEXT,
    "serviciuId" INTEGER,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "utilizatorId" INTEGER NOT NULL,
    "categorieId" INTEGER NOT NULL,
    "serviciuId" INTEGER,
    "titlu" TEXT NOT NULL,
    "descriere" TEXT NOT NULL,
    "latitudine" DOUBLE PRECISION,
    "longitudine" DOUBLE PRECISION,
    "status" "ProblemStatus" NOT NULL DEFAULT 'NOUA',
    "prioritate" "ProblemPriority" NOT NULL DEFAULT 'MEDIE',
    "dataCrearii" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "problemaId" INTEGER NOT NULL,
    "cale" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" SERIAL NOT NULL,
    "problemaId" INTEGER NOT NULL,
    "status" "ProblemStatus" NOT NULL,
    "comentariu" TEXT,
    "utilizatorId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_code_key" ON "Problem"("code");

-- CreateIndex
CREATE INDEX "Problem_categorieId_idx" ON "Problem"("categorieId");

-- CreateIndex
CREATE INDEX "Problem_status_idx" ON "Problem"("status");

-- CreateIndex
CREATE INDEX "Problem_prioritate_idx" ON "Problem"("prioritate");

-- CreateIndex
CREATE INDEX "Problem_latitudine_longitudine_idx" ON "Problem"("latitudine", "longitudine");

-- CreateIndex
CREATE INDEX "Problem_utilizatorId_idx" ON "Problem"("utilizatorId");

-- CreateIndex
CREATE INDEX "Photo_problemaId_idx" ON "Photo"("problemaId");

-- CreateIndex
CREATE INDEX "StatusHistory_problemaId_idx" ON "StatusHistory"("problemaId");

-- CreateIndex
CREATE INDEX "StatusHistory_utilizatorId_idx" ON "StatusHistory"("utilizatorId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_serviciuId_fkey" FOREIGN KEY ("serviciuId") REFERENCES "MunicipalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_serviciuId_fkey" FOREIGN KEY ("serviciuId") REFERENCES "MunicipalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_problemaId_fkey" FOREIGN KEY ("problemaId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_problemaId_fkey" FOREIGN KEY ("problemaId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
