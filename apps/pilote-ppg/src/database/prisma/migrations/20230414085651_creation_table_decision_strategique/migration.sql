-- CreateEnum
CREATE TYPE "public"."type_decision_strategique" AS ENUM ('suivi_des_decisions');

-- CreateTable
CREATE TABLE "public"."decision_strategique" (
    "id" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "type" "public"."type_decision_strategique" NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "chantier_id" TEXT NOT NULL,

    CONSTRAINT "decision_strategique_pkey" PRIMARY KEY ("id")
);
