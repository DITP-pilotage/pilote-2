/*
  Warnings:

  - You are about to drop the column `auteur_creation` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_modification` on the `utilisateur` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."utilisateur" DROP COLUMN "auteur_creation",
DROP COLUMN "auteur_modification",
ADD COLUMN     "auteur_id_creation" UUID,
ADD COLUMN     "auteur_id_modification" UUID;

-- AddForeignKey
ALTER TABLE "public"."utilisateur" ADD CONSTRAINT "utilisateur_auteur_id_modification_fkey" FOREIGN KEY ("auteur_id_modification") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."utilisateur" ADD CONSTRAINT "utilisateur_auteur_id_creation_fkey" FOREIGN KEY ("auteur_id_creation") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
