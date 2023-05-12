-- CreateTable
CREATE TABLE "public"."indicateur_projet_structurant" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "projet_structurant_code" TEXT NOT NULL,
    "type_id" TEXT,
    "description" TEXT,
    "source" TEXT,
    "mode_de_calcul" TEXT,

    CONSTRAINT "indicateur_projet_structurant_pkey" PRIMARY KEY ("id")
);
