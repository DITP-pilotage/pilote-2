/*
  Warnings:

  - The primary key for the `indicateur` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "indicateur" DROP CONSTRAINT "indicateur_pkey",
ADD COLUMN     "code_insee" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "maille" TEXT NOT NULL DEFAULT 'NAT',
ADD COLUMN     "zone_nom" TEXT,
ADD CONSTRAINT "indicateur_pkey" PRIMARY KEY ("id", "code_insee", "maille");
ALTER TABLE "indicateur" ALTER COLUMN "code_insee" DROP DEFAULT,
ALTER COLUMN "maille" DROP DEFAULT;
