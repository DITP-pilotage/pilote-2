/*
  Warnings:

  - You are about to drop the `etape_evaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_objectif` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_sous_critere` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fiche_evaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rattachement_utilisateur_etape_jalon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referentiel_critere` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referentiel_objectif` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referentiel_rattachement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referentiel_sous_critere` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."etape_evaluation" DROP CONSTRAINT "etape_evaluation_fiche_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_objectif" DROP CONSTRAINT "evaluation_objectif_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_objectif" DROP CONSTRAINT "evaluation_objectif_etape_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_objectif" DROP CONSTRAINT "evaluation_objectif_objectif_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_sous_critere" DROP CONSTRAINT "evaluation_sous_critere_auteur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_sous_critere" DROP CONSTRAINT "evaluation_sous_critere_etape_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."evaluation_sous_critere" DROP CONSTRAINT "evaluation_sous_critere_sous_critere_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."fiche_evaluation" DROP CONSTRAINT "fiche_evaluation_rattachement_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."rattachement_utilisateur_etape_jalon" DROP CONSTRAINT "rattachement_utilisateur_etape_jalon_rattachement_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."rattachement_utilisateur_etape_jalon" DROP CONSTRAINT "rattachement_utilisateur_etape_jalon_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."referentiel_objectif" DROP CONSTRAINT "referentiel_objectif_rattachement_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."referentiel_sous_critere" DROP CONSTRAINT "referentiel_sous_critere_parent_id_fkey";

-- DropTable
DROP TABLE "public"."etape_evaluation";

-- DropTable
DROP TABLE "public"."evaluation_objectif";

-- DropTable
DROP TABLE "public"."evaluation_sous_critere";

-- DropTable
DROP TABLE "public"."fiche_evaluation";

-- DropTable
DROP TABLE "public"."rattachement_utilisateur_etape_jalon";

-- DropTable
DROP TABLE "public"."referentiel_critere";

-- DropTable
DROP TABLE "public"."referentiel_objectif";

-- DropTable
DROP TABLE "public"."referentiel_rattachement";

-- DropTable
DROP TABLE "public"."referentiel_sous_critere";

-- DropEnum
DROP TYPE "public"."etape_evaluation_enum";
