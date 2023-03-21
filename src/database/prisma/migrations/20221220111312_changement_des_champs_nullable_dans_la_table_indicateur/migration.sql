-- AlterTable
ALTER TABLE "indicateur" ALTER COLUMN "objectif_valeur_cible" DROP NOT NULL,
ALTER COLUMN "objectif_taux_avancement" DROP NOT NULL,
ALTER COLUMN "objectif_date_valeur_cible" DROP NOT NULL,
ALTER COLUMN "type_id" DROP NOT NULL,
ALTER COLUMN "type_nom" DROP NOT NULL,
ALTER COLUMN "est_barometre" DROP NOT NULL,
ALTER COLUMN "est_phare" DROP NOT NULL;
