-- AlterTable
ALTER TABLE "public"."indicateur_projet_structurant" ADD COLUMN     "date_taux_avancement" TIMESTAMP,
ADD COLUMN     "date_valeur_actuelle" TIMESTAMP,
ADD COLUMN     "date_valeur_cible" TIMESTAMP,
ADD COLUMN     "date_valeur_initiale" TIMESTAMP,
ADD COLUMN     "taux_avancement" DOUBLE PRECISION,
ADD COLUMN     "valeur_actuelle" DOUBLE PRECISION,
ADD COLUMN     "valeur_cible" DOUBLE PRECISION,
ADD COLUMN     "valeur_initiale" DOUBLE PRECISION;
