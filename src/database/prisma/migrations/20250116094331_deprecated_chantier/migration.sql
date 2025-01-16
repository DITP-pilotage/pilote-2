/*
  Warnings:

  - You are about to drop the `chantier` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."chantier" DROP CONSTRAINT "chantier_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."chantier";

-- CreateTable
CREATE TABLE "public"."deprecated_chantier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "perimetre_ids" TEXT[],
    "taux_avancement" DOUBLE PRECISION,
    "taux_avancement_date" DATE,
    "derniere_maj_date_qualitative" DATE,
    "taux_avancement_precedent" DOUBLE PRECISION,
    "taux_avancement_annuel" DOUBLE PRECISION,
    "ecart" DOUBLE PRECISION,
    "territoire_nom" TEXT,
    "code_insee" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "directeurs_administration_centrale" TEXT[],
    "directeurs_projet" TEXT[],
    "responsables_locaux" TEXT[],
    "coordinateurs_territoriaux" TEXT[],
    "ministeres" TEXT[],
    "ministeres_acronymes" TEXT[],
    "directions_administration_centrale" TEXT[],
    "meteo" TEXT DEFAULT 'NON_RENSEIGNEE',
    "axe" TEXT NOT NULL DEFAULT 'non renseignée',
    "ppg" TEXT NOT NULL DEFAULT 'non renseignée',
    "directeurs_projet_mails" TEXT[],
    "responsables_locaux_mails" TEXT[],
    "coordinateurs_territoriaux_mails" TEXT[],
    "est_barometre" BOOLEAN,
    "est_territorialise" BOOLEAN,
    "territoire_code" TEXT NOT NULL,
    "ate" "public"."type_ate",
    "a_taux_avancement_departemental" BOOLEAN,
    "a_taux_avancement_regional" BOOLEAN,
    "a_meteo_departemental" BOOLEAN,
    "a_meteo_regional" BOOLEAN,
    "est_applicable" BOOLEAN,
    "statut" "public"."type_statut" NOT NULL DEFAULT 'PUBLIE',
    "tendance" "public"."type_tendance",
    "tendance_int_index" DOUBLE PRECISION,
    "meteo_int_index" DOUBLE PRECISION,
    "donnees_maille_source" "public"."maille",
    "cible_attendue" BOOLEAN NOT NULL DEFAULT true,
    "a_supprimer" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "deprecated_chantier_pkey" PRIMARY KEY ("id","code_insee","maille")
);

-- AddForeignKey
ALTER TABLE "public"."deprecated_chantier" ADD CONSTRAINT "deprecated_chantier_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
