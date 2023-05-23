/*
  Warnings:

  - You are about to drop the column `ministeres` on the `projet_structurant` table. All the data in the column will be lost.
  - Added the required column `territoire_code` to the `projet_structurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."projet_structurant" DROP COLUMN "ministeres",
ADD COLUMN     "perimetres_ids_ministere_porteur" TEXT[],
ADD COLUMN     "perimetres_ids_ministeres_coporteurs" TEXT[],
ADD COLUMN     "territoire_code" TEXT NOT NULL;
