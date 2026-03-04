/*
  Warnings:

  - You are about to drop the column `auteur_id` on the `synthese_des_resultats` table. All the data in the column will be lost.
  - You are about to drop the column `date_commentaire` on the `synthese_des_resultats` table. All the data in the column will be lost.
  - You are about to drop the column `date_meteo` on the `synthese_des_resultats` table. All the data in the column will be lost.
  - Added the required column `date_creation` to the `synthese_des_resultats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_modification` to the `synthese_des_resultats` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."statut_synthese_des_resultats" AS ENUM ('BROUILLON', 'PUBLIE');

-- DropForeignKey
ALTER TABLE "public"."synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_auteur_id_fkey";

-- AlterTable: add new columns as nullable first to allow data copy
ALTER TABLE "public"."synthese_des_resultats"
ADD COLUMN     "auteur_creation_id" UUID,
ADD COLUMN     "auteur_modification_id" UUID,
ADD COLUMN     "date_creation" TIMESTAMP,
ADD COLUMN     "date_modification" TIMESTAMP,
ADD COLUMN     "statut" "public"."statut_synthese_des_resultats" NOT NULL DEFAULT 'PUBLIE';

-- CopyData
UPDATE "public"."synthese_des_resultats" SET
  "auteur_creation_id" = "auteur_id",
  "auteur_modification_id" = "auteur_id",
  "date_creation" = COALESCE("date_commentaire", '2024-01-01'),
  "date_modification" = COALESCE("date_commentaire", '2024-01-01');

-- SetNotNull
ALTER TABLE "public"."synthese_des_resultats"
ALTER COLUMN "date_creation" SET NOT NULL,
ALTER COLUMN "date_modification" SET NOT NULL;

-- DropColumns
ALTER TABLE "public"."synthese_des_resultats"
DROP COLUMN "auteur_id",
DROP COLUMN "date_commentaire",
DROP COLUMN "date_meteo";

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
