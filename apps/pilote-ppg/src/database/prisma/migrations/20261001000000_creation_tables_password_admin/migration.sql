-- Cycle de renouvellement des mots de passe des comptes DITP_ADMIN (6 mois).
-- PILOTE ne stocke jamais de mot de passe : seules les dates du cycle sont suivies.

-- CreateEnum
CREATE TYPE "public"."type_action_password" AS ENUM ('PREMIERE_RELANCE', 'DEUXIEME_RELANCE', 'EXPIRATION');

-- CreateEnum
CREATE TYPE "public"."statut_action_password" AS ENUM ('CREEE', 'SUCCES', 'ECHEC');

-- CreateTable
CREATE TABLE "public"."suivi_password_admin" (
    "utilisateur_id" UUID NOT NULL,
    "date_dernier_changement" TIMESTAMP(3) NOT NULL,
    "date_expiration" TIMESTAMP(3) NOT NULL,
    "date_premiere_relance" TIMESTAMP(3),
    "date_deuxieme_relance" TIMESTAMP(3),
    "date_expiration_forcee" TIMESTAMP(3),

    CONSTRAINT "suivi_password_admin_pkey" PRIMARY KEY ("utilisateur_id")
);

-- CreateTable
CREATE TABLE "public"."action_password" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" UUID NOT NULL,
    "type_action" "public"."type_action_password" NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."statut_action_password" NOT NULL DEFAULT 'CREEE',
    "date_succes" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,

    CONSTRAINT "action_password_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_password_utilisateur_id_statut_idx" ON "public"."action_password"("utilisateur_id", "statut");

-- AddForeignKey
ALTER TABLE "public"."suivi_password_admin" ADD CONSTRAINT "suivi_password_admin_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
