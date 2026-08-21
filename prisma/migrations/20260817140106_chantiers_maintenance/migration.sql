-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITIQUE', 'HAUTE', 'MOYENNE', 'FAIBLE');

-- CreateEnum
CREATE TYPE "ChantierStatus" AS ENUM ('A_PLANIFIER', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE', 'TERMINE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('A_PLANIFIER', 'PLANIFIEE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE');

-- CreateTable
CREATE TABLE "chantiers" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ChantierStatus" NOT NULL DEFAULT 'A_PLANIFIER',
    "priority" "Priority" NOT NULL DEFAULT 'MOYENNE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "responsable" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenances" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "equipementId" TEXT,
    "title" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'PREVENTIVE',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'A_PLANIFIER',
    "priority" "Priority" NOT NULL DEFAULT 'MOYENNE',
    "scheduledDate" TIMESTAMP(3),
    "responsable" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chantiers_siteId_idx" ON "chantiers"("siteId");

-- CreateIndex
CREATE INDEX "maintenances_siteId_idx" ON "maintenances"("siteId");

-- CreateIndex
CREATE INDEX "maintenances_equipementId_idx" ON "maintenances"("equipementId");

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_equipementId_fkey" FOREIGN KEY ("equipementId") REFERENCES "equipements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
