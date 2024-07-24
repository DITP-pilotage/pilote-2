-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN     "auteur_proposition" TEXT,
ADD COLUMN     "date_proposition" DATE,
ADD COLUMN     "motif_proposition" TEXT,
ADD COLUMN     "objectif_taux_avancement_intermediaire_proposition" DOUBLE PRECISION,
ADD COLUMN     "objectif_taux_avancement_proposition" DOUBLE PRECISION,
ADD COLUMN     "source_donnee_methode_calcul_proposition" TEXT,
ADD COLUMN     "valeur_actuelle_proposition" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."proposition_valeur_actuelle" ALTER COLUMN "date_valeur_actuelle" SET DATA TYPE TIMESTAMP,
ALTER COLUMN "date_proposition" SET DATA TYPE TIMESTAMP;
