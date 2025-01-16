/*
  Warnings:

  - You are about to drop the `indicateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."indicateur" DROP CONSTRAINT "indicateur_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."indicateur";

-- CreateTable
CREATE TABLE "public"."deprecated_indicateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "objectif_valeur_cible" DOUBLE PRECISION,
    "objectif_taux_avancement" DOUBLE PRECISION,
    "objectif_date_valeur_cible" DATE,
    "type_id" TEXT,
    "type_nom" TEXT,
    "est_barometre" BOOLEAN,
    "est_phare" BOOLEAN,
    "valeur_initiale" DOUBLE PRECISION,
    "date_valeur_initiale" DATE,
    "valeur_actuelle" DOUBLE PRECISION,
    "date_valeur_actuelle" DATE,
    "territoire_nom" TEXT,
    "code_insee" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "evolution_valeur_actuelle" JSONB,
    "description" TEXT,
    "source" TEXT,
    "mode_de_calcul" TEXT,
    "unite_mesure" TEXT,
    "territoire_code" TEXT NOT NULL,
    "ponderation_zone_declaree" DOUBLE PRECISION,
    "ponderation_zone_reel" DOUBLE PRECISION,
    "objectif_valeur_cible_intermediaire" DOUBLE PRECISION,
    "objectif_taux_avancement_intermediaire" DOUBLE PRECISION,
    "objectif_date_valeur_cible_intermediaire" DATE,
    "est_applicable" BOOLEAN,
    "a_supprimer" BOOLEAN NOT NULL DEFAULT true,
    "dernier_import_date" DATE,
    "dernier_import_rapport_id" UUID,
    "dernier_import_auteur" TEXT,
    "dernier_import_date_indic" DATE,
    "dernier_import_rapport_id_indic" UUID,
    "dernier_import_auteur_indic" TEXT,
    "prochaine_date_maj" DATE,
    "prochaine_date_maj_jours" INTEGER,
    "prochaine_date_valeur_actuelle" DATE,
    "periodicite" TEXT,
    "delai_disponibilite" INTEGER,
    "est_a_jour" BOOLEAN,
    "tendance" TEXT,
    "parent_id" TEXT,
    "valeur_actuelle_proposition" DOUBLE PRECISION,
    "objectif_taux_avancement_intermediaire_proposition" DOUBLE PRECISION,
    "objectif_taux_avancement_proposition" DOUBLE PRECISION,
    "date_proposition" DATE,
    "motif_proposition" TEXT,
    "source_donnee_methode_calcul_proposition" TEXT,
    "auteur_proposition" TEXT,
    "responsables_donnees_mails" TEXT[],

    CONSTRAINT "deprecated_indicateur_pkey" PRIMARY KEY ("id","code_insee","maille")
);

-- AddForeignKey
ALTER TABLE "public"."deprecated_indicateur" ADD CONSTRAINT "deprecated_indicateur_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
