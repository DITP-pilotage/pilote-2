-- CreateTable
CREATE TABLE "public"."objectif_projet_structurant" (
    "projet_structurant_id" TEXT NOT NULL,
    "territoire_id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "auteur" TEXT,

    CONSTRAINT "objectif_projet_structurant_pkey" PRIMARY KEY ("projet_structurant_id","territoire_id","date")
);
