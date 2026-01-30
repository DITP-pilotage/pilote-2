-- CreateEnum
CREATE TYPE "public"."type_action_compte_inactif" AS ENUM ('PREMIERE_RELANCE', 'DEUXIEME_RELANCE', 'DESACTIVATION');

-- CreateEnum
CREATE TYPE "public"."statut_action_compte_inactif" AS ENUM ('CREEE', 'SUCCES', 'ECHEC');

-- CreateTable
CREATE TABLE "public"."action_compte_inactif" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" TEXT NOT NULL,
    "type_action" "public"."type_action_compte_inactif" NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."statut_action_compte_inactif" NOT NULL DEFAULT 'CREEE',
    "date_succes" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,

    CONSTRAINT "action_compte_inactif_pkey" PRIMARY KEY ("id")
);
