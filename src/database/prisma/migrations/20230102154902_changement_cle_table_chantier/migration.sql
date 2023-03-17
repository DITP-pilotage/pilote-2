/*
  Warnings:

  - The primary key for the `chantier` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "chantier" DROP CONSTRAINT "chantier_pkey",
ADD CONSTRAINT "chantier_pkey" PRIMARY KEY ("id", "code_insee", "maille");
