-- CreateTable
CREATE TABLE "public"."gestion_contenu" (
    "nom_variable_contenu" TEXT NOT NULL,
    "valeur_variable_contenu" TEXT NOT NULL,

    CONSTRAINT "gestion_contenu_pkey" PRIMARY KEY ("nom_variable_contenu")
);
