/*
  Warnings:

  - You are about to drop the column `auteur` on the `decision_strategique` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."decision_strategique" DROP COLUMN "auteur",
ADD COLUMN     "auteur_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
