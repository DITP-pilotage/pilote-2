-- AlterTable
ALTER TABLE "public"."indicateur_territoire" ADD COLUMN     "taux_avancement_mandat_proposition_v2" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."indicateur_territoire_jalon" ADD COLUMN     "taux_avancement_proposition_v2" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."indicateur_territoire_valeur_evenement" ALTER COLUMN "valeur" DROP NOT NULL;
