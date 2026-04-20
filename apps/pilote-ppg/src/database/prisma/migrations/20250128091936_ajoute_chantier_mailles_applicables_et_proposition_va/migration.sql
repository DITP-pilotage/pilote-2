-- AlterTable
ALTER TABLE "public"."chantier_identite" ADD COLUMN     "mailles_applicables" "public"."maille"[];

-- AlterTable
ALTER TABLE "public"."chantier_territoire" ADD COLUMN     "possede_proposition_valeur_actuelle" BOOLEAN NOT NULL DEFAULT false;
