/*
  Warnings:

  - Added the required column `rapport_id` to the `mesure_indicateur` table without a default value. This is not possible if the table is not empty.

*/

-- Clean Table => La table n'est pas utilisé en prod, on supprime les données en amont pour pouvoir modifier la structure et ajouter le lien avec le rapport

DELETE FROM "raw_data"."mesure_indicateur";

-- AlterTable
ALTER TABLE "raw_data"."mesure_indicateur" ADD COLUMN     "rapport_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "public"."rapport_import_mesure_indicateur" (
    "id" UUID NOT NULL,
    "date_creation" TIMESTAMPTZ NOT NULL,
    "utilisateurEmail" TEXT NOT NULL,

    CONSTRAINT "rapport_import_mesure_indicateur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."rapport_import_mesure_indicateur" ADD CONSTRAINT "rapport_import_mesure_indicateur_utilisateurEmail_fkey" FOREIGN KEY ("utilisateurEmail") REFERENCES "public"."utilisateur"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
