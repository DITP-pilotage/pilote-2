/*
  Warnings:

  - The primary key for the `mesure_indicateur` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `indicId` on the `mesure_indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `metricDate` on the `mesure_indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `metricType` on the `mesure_indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `metricValue` on the `mesure_indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `zoneId` on the `mesure_indicateur` table. All the data in the column will be lost.
  - Added the required column `indic_id` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metric_date` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metric_type` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metric_value` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_id` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `mesure_indicateur` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "raw_data"."mesure_indicateur" DROP CONSTRAINT "mesure_indicateur_pkey",
DROP COLUMN "indicId",
DROP COLUMN "metricDate",
DROP COLUMN "metricType",
DROP COLUMN "metricValue",
DROP COLUMN "zoneId",
ADD COLUMN     "indic_id" TEXT NOT NULL,
ADD COLUMN     "metric_date" TEXT NOT NULL,
ADD COLUMN     "metric_type" TEXT NOT NULL,
ADD COLUMN     "metric_value" TEXT NOT NULL,
ADD COLUMN     "zone_id" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "date_import" DROP NOT NULL,
ADD CONSTRAINT "mesure_indicateur_pkey" PRIMARY KEY ("id");
