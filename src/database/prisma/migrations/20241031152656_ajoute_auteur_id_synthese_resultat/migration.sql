/*
  Warnings:

  - You are about to drop the column `auteur` on the `synthese_des_resultats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" DROP COLUMN "auteur",
ADD COLUMN     "auteur_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
