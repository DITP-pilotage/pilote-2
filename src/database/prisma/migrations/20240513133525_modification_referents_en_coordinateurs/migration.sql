/*
  Warnings:

  - You are about to drop the column `referents_territoriaux` on the `chantier` table. All the data in the column will be lost.
  - You are about to drop the column `referents_territoriaux_mails` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier" DROP COLUMN "referents_territoriaux",
DROP COLUMN "referents_territoriaux_mails",
ADD COLUMN     "coordinateurs_territoriaux" TEXT[],
ADD COLUMN     "coordinateurs_territoriaux_mails" TEXT[];
