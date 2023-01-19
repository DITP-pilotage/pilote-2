-- CreateTable
CREATE TABLE "synthese_des_resultats" (
    "chantier_id" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "meteo" TEXT,
    "commentaire" TEXT,
    "date" TIMESTAMP NOT NULL,

    CONSTRAINT "synthese_des_resultats_pkey" PRIMARY KEY ("chantier_id","maille","code_insee","date")
);
