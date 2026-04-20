/*
  Warnings:

  - You are about to drop the column `synthese_des_resultats` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chantier" DROP COLUMN "synthese_des_resultats";

-- CreateTable
CREATE TABLE "synthese_des_resultats" (
    "id" SERIAL NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,
    "meteo" TEXT,
    "date_meteo" TIMESTAMP,
    "commentaire" TEXT,
    "date_commentaire" TIMESTAMP,

    CONSTRAINT "synthese_des_resultats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "synthese_des_resultats_chantier_id_maille_code_insee_date_m_idx" ON "synthese_des_resultats"("chantier_id", "maille", "code_insee", "date_meteo", "date_commentaire");
