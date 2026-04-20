-- CreateTable
CREATE TABLE "public"."proposition_valeur_actuelle" (
    "id" UUID NOT NULL,
    "indic_id" TEXT NOT NULL,
    "valeur_actuelle_proposee" DOUBLE PRECISION NOT NULL,
    "territoire_code" TEXT NOT NULL,
    "date_valeur_actuelle" DATE,
    "auteur_modification" TEXT NOT NULL,
    "id_auteur_modification" TEXT NOT NULL,
    "date_proposition" DATE,
    "motif_proposition" TEXT NOT NULL,
    "source_donnee_methode_calcul" TEXT NOT NULL,
    "statut" TEXT NOT NULL,

    CONSTRAINT "proposition_valeur_actuelle_pkey" PRIMARY KEY ("id")
);
