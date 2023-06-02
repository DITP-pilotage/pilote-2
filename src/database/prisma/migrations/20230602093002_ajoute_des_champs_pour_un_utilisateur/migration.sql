/*
 Warnings:
 
 - Made the column `nom` on table `utilisateur` required. This step will fail if there are existing NULL values in that column.
 - Made the column `prenom` on table `utilisateur` required. This step will fail if there are existing NULL values in that column.
 
 */
-- AlterTable
ALTER TABLE "public"."utilisateur"
ADD COLUMN "auteur_modification" TEXT,
  ADD COLUMN "date_modification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "fonction" TEXT,
  ALTER COLUMN "nom"
SET NOT NULL,
  ALTER COLUMN "prenom"
SET NOT NULL;
-- UPDATE existing data
UPDATE "public"."utilisateur"
SET "auteur_modification" = 'Import CSV';
-- AlterTable
ALTER TABLE "public"."utilisateur"
ALTER COLUMN "auteur_modification"
SET NOT NULL;