-- CreateTable
CREATE TABLE "productions" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "energyKwh" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meteo_data" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "irradiation" DOUBLE PRECISION,
    "ghi" DOUBLE PRECISION,
    "dni" DOUBLE PRECISION,
    "dhi" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "precipitation" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meteo_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productions_siteId_idx" ON "productions"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "productions_siteId_date_key" ON "productions"("siteId", "date");

-- CreateIndex
CREATE INDEX "meteo_data_siteId_idx" ON "meteo_data"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "meteo_data_siteId_date_key" ON "meteo_data"("siteId", "date");

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meteo_data" ADD CONSTRAINT "meteo_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
