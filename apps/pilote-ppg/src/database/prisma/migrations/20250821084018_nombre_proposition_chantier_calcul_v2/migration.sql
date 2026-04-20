-- AlterTable
ALTER TABLE "public"."chantier_territoire" ADD COLUMN     "nombre_propositions_valeur_actuelle_ponderee_v2" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nombre_propositions_valeur_actuelle_v2" INTEGER NOT NULL DEFAULT 0;
