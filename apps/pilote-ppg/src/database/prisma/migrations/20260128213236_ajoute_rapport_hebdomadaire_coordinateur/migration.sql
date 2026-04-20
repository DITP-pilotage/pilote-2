-- CreateEnum
CREATE TYPE "public"."statut_envoi_rapport" AS ENUM ('CREE', 'ENVOYE', 'ECHEC');

-- CreateTable
CREATE TABLE "public"."rapport_hebdomadaire_coordinateur" (
    "id" UUID NOT NULL,
    "coordinateur_id" UUID NOT NULL,
    "date_debut_periode" TIMESTAMP(3) NOT NULL,
    "date_fin_periode" TIMESTAMP(3) NOT NULL,
    "contenu_rapport" JSONB NOT NULL,
    "statut_envoi" "public"."statut_envoi_rapport" NOT NULL DEFAULT 'CREE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_envoi" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur_envoi" TEXT,

    CONSTRAINT "rapport_hebdomadaire_coordinateur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rapport_hebdomadaire_coordinateur_statut_envoi_idx" ON "public"."rapport_hebdomadaire_coordinateur"("statut_envoi");

-- CreateIndex
CREATE INDEX "rapport_hebdomadaire_coordinateur_date_creation_idx" ON "public"."rapport_hebdomadaire_coordinateur"("date_creation");

-- CreateIndex
CREATE UNIQUE INDEX "rapport_hebdomadaire_coordinateur_coordinateur_id_date_debu_key" ON "public"."rapport_hebdomadaire_coordinateur"("coordinateur_id", "date_debut_periode", "date_fin_periode");

-- AddForeignKey
ALTER TABLE "public"."rapport_hebdomadaire_coordinateur" ADD CONSTRAINT "rapport_hebdomadaire_coordinateur_coordinateur_id_fkey" FOREIGN KEY ("coordinateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
