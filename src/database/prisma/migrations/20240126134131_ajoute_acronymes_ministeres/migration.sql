/*
  Warnings:

  - Added the required column `acronyme` to the `ministere` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "ministeres_acronymes" TEXT[];

-- AlterTable
ALTER TABLE "public"."ministere" ADD COLUMN     "acronyme" TEXT NOT NULL;
