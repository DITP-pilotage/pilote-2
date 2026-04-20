-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "a_meteo_departemental" BOOLEAN,
ADD COLUMN     "a_meteo_regional" BOOLEAN,
ADD COLUMN     "a_taux_acancement_regional" BOOLEAN;
