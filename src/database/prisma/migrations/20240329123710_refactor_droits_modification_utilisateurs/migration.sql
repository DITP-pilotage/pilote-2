/*
  Warnings:

  - You are about to drop the column `peut_consulter_les_utilisateurs` on the `profil` table. All the data in the column will be lost.
  - You are about to drop the column `peut_supprimer_les_utilisateurs` on the `profil` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."profil" DROP COLUMN "peut_consulter_les_utilisateurs",
DROP COLUMN "peut_supprimer_les_utilisateurs",
ADD COLUMN     "a_acces_a_tous_les_chantiers_utilisateurs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "a_acces_a_tous_les_territoires_utilisateurs" BOOLEAN NOT NULL DEFAULT false;
