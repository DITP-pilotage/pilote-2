/*
  Warnings:

  - You are about to drop the column `auteur` on the `objectif` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."objectif" DROP COLUMN "auteur",
ADD COLUMN     "auteur_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
