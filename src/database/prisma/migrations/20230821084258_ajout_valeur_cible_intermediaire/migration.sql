-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN     "objectif_date_valeur_cible_intermediaire" DATE,
ADD COLUMN     "objectif_taux_avancement_intermediaire" DOUBLE PRECISION,
ADD COLUMN     "objectif_valeur_cible_intermediaire" DOUBLE PRECISION;
