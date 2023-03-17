-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN     "date_valeur_actuelle" DATE,
ADD COLUMN     "date_valeur_initiale" DATE,
ADD COLUMN     "valeur_actuelle" DOUBLE PRECISION,
ADD COLUMN     "valeur_initiale" DOUBLE PRECISION;
