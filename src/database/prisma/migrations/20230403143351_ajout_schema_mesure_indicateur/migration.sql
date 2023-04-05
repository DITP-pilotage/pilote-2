/*
  Warnings:

  - You are about to drop the `mesure_indicateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "raw_data";

-- DropTable
DROP TABLE "public"."mesure_indicateur";

-- CreateTable
CREATE TABLE "raw_data"."mesure_indicateur" (
    "id" TEXT NOT NULL,
    "indicId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "metricDate" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" TEXT NOT NULL,

    CONSTRAINT "mesure_indicateur_pkey" PRIMARY KEY ("id")
);
