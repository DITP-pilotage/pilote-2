/*
  Warnings:

  - You are about to drop the column `auteur` on the `commentaire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."commentaire" DROP COLUMN "auteur",
ADD COLUMN     "auteur_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
