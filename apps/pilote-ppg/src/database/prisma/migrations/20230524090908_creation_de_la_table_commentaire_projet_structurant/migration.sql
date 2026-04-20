-- CreateTable
CREATE TABLE "public"."commentaire_projet_structurant" (
    "id" UUID NOT NULL,
    "projet_structurant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "auteur" TEXT,

    CONSTRAINT "commentaire_projet_structurant_pkey" PRIMARY KEY ("id")
);
