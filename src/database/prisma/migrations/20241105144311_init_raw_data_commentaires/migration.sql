-- CreateTable
DROP TABLE IF EXISTS "raw_data"."commentaires" CASCADE;
CREATE TABLE "raw_data"."commentaires" (
    "chantier_id" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT,
    "meteo" TEXT,
    "date_meteo" TEXT,
    "auteur_email" TEXT,

    CONSTRAINT "commentaires_pkey" PRIMARY KEY ("chantier_id","code_insee","maille","type","date")
);
