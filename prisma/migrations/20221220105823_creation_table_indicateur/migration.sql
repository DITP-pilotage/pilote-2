-- CreateTable
CREATE TABLE "indicateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "objectif_valeur_cible" DOUBLE PRECISION NOT NULL,
    "objectif_taux_avancement" DOUBLE PRECISION NOT NULL,
    "objectif_date_valeur_cible" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "type_nom" TEXT NOT NULL,
    "est_barometre" BOOLEAN NOT NULL,
    "est_phare" BOOLEAN NOT NULL,

    CONSTRAINT "indicateur_pkey" PRIMARY KEY ("id")
);
