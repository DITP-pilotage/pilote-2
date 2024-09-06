-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN     "delai_disponibilite" INTEGER,
ADD COLUMN     "periodicite" TEXT,
ADD COLUMN     "prochaine_date_valeur_actuelle" DATE;
