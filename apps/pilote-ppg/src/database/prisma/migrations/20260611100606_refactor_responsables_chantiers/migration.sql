/*
  Warnings:

  - You are about to drop the column `directeurs_projet` on the `chantier_identite` table. All the data in the column will be lost.
  - You are about to drop the column `directeurs_projet_mails` on the `chantier_identite` table. All the data in the column will be lost.
  - You are about to drop the column `coordinateurs_territoriaux` on the `chantier_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `coordinateurs_territoriaux_mails` on the `chantier_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `responsables_locaux` on the `chantier_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `responsables_locaux_mails` on the `chantier_territoire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier_identite" DROP COLUMN "directeurs_projet",
DROP COLUMN "directeurs_projet_mails",
ADD COLUMN     "directeurs_projet_ids" TEXT[];

-- AlterTable
ALTER TABLE "public"."chantier_territoire" DROP COLUMN "coordinateurs_territoriaux",
DROP COLUMN "coordinateurs_territoriaux_mails",
DROP COLUMN "responsables_locaux",
DROP COLUMN "responsables_locaux_mails",
ADD COLUMN     "coordinateurs_territoriaux_ids" TEXT[],
ADD COLUMN     "responsables_locaux_ids" TEXT[];
