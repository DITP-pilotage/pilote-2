/*
  Warnings:

  - You are about to drop the column `nombre_propositions_valeur_actuelle` on the `chantier_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_propositions_valeur_actuelle_ponderee` on the `chantier_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `date_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `motif_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `source_donnee_methode_calcul_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `taux_avancement_mandat_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `valeur_actuelle_proposition` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `taux_avancement_proposition` on the `indicateur_territoire_jalon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier_territoire" DROP COLUMN "nombre_propositions_valeur_actuelle",
DROP COLUMN "nombre_propositions_valeur_actuelle_ponderee";

-- AlterTable
ALTER TABLE "public"."indicateur_territoire" DROP COLUMN "auteur_proposition",
DROP COLUMN "date_proposition",
DROP COLUMN "motif_proposition",
DROP COLUMN "source_donnee_methode_calcul_proposition",
DROP COLUMN "taux_avancement_mandat_proposition",
DROP COLUMN "valeur_actuelle_proposition";

-- AlterTable
ALTER TABLE "public"."indicateur_territoire_jalon" DROP COLUMN "taux_avancement_proposition";
