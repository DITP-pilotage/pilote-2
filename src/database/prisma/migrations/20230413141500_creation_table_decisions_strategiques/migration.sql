-- CreateEnum
CREATE TYPE "public"."type_decisions_strategique" AS ENUM ('suivi_des_decisions');

-- CreateTable
CREATE TABLE "public"."decisions_strategiques" (
    "id" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "type" "public"."type_decisions_strategique" NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "chantier_id" TEXT NOT NULL,

    CONSTRAINT "decisions_strategiques_pkey" PRIMARY KEY ("id")
);
