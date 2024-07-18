-- AlterTable
ALTER TABLE public.indicateur ADD COLUMN     objectif_taux_avancement_intermediaire_propose DOUBLE PRECISION,
ADD COLUMN     objectif_taux_avancement_propose DOUBLE PRECISION,
ADD COLUMN     valeur_actuelle_propose DOUBLE PRECISION;

