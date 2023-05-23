-- CreateTable
CREATE TABLE "public"."synthese_des_resultats_projet_structurant" (
    "id" TEXT NOT NULL,
    "projet_structurant_id" TEXT NOT NULL,
    "meteo" TEXT,
    "date_meteo" TIMESTAMP,
    "commentaire" TEXT,
    "date_commentaire" TIMESTAMP,
    "auteur" TEXT,

    CONSTRAINT "synthese_des_resultats_projet_structurant_pkey" PRIMARY KEY ("id")
);
