/*
  Warnings:

  - You are about to drop the column `co_porteur` on the `projet_structurant` table. All the data in the column will be lost.
  - You are about to drop the column `perimetres_ids_ministere_porteur` on the `projet_structurant` table. All the data in the column will be lost.
  - You are about to drop the column `perimetres_ids_ministeres_coporteurs` on the `projet_structurant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."projet_structurant" DROP COLUMN "co_porteur",
DROP COLUMN "perimetres_ids_ministere_porteur",
DROP COLUMN "perimetres_ids_ministeres_coporteurs",
ADD COLUMN     "co_porteurs" TEXT[],
ADD COLUMN     "perimetres_ids" TEXT[];
