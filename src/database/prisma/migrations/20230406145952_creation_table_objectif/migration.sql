-- CreateEnum
CREATE TYPE "public"."type_objectif" AS ENUM ('notre_ambition', 'deja_fait', 'a_faire');

-- CreateTable
CREATE TABLE "public"."objectif" (
    "id" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "type" "public"."type_objectif" NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "chantier_id" TEXT NOT NULL,

    CONSTRAINT "objectif_pkey" PRIMARY KEY ("id")
);
