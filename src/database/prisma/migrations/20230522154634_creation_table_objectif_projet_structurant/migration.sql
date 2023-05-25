-- CreateTable
CREATE TABLE "public"."objectif_projet_structurant" (
    "id" TEXT NOT NULL,
    "projet_structurant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "auteur" TEXT,

    CONSTRAINT "objectif_projet_structurant_pkey" PRIMARY KEY ("id")
);
