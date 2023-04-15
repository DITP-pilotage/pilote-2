/*
  Warnings:

  - Added the required column `nom` to the `utilisateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `utilisateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."utilisateur" ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "prenom" TEXT NOT NULL;
