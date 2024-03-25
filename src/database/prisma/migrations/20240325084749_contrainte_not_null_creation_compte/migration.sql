/*
  Warnings:

  - Made the column `auteur_creation` on table `utilisateur` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date_creation` on table `utilisateur` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
UPDATE "public"."utilisateur" SET "date_creation" = '2024-01-01' WHERE "date_creation" is null;
UPDATE "public"."utilisateur" SET "auteur_creation" = 'DITP ADMIN' WHERE "auteur_creation" is null;

ALTER TABLE "public"."utilisateur" ALTER COLUMN "auteur_creation" SET NOT NULL,
ALTER COLUMN "date_creation" SET NOT NULL;
