/*
  Warnings:

  - You are about to drop the `panier_individu_commentaire` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "panier_individu_commentaire" DROP CONSTRAINT "panier_individu_commentaire_commentaire_id_fkey";

-- DropForeignKey
ALTER TABLE "panier_individu_commentaire" DROP CONSTRAINT "panier_individu_commentaire_individu_id_fkey";

-- DropForeignKey
ALTER TABLE "panier_individu_commentaire" DROP CONSTRAINT "panier_individu_commentaire_panier_id_fkey";

-- DropTable
DROP TABLE "panier_individu_commentaire";

-- DropEnum
DROP TYPE "panier_individu_commentaire_type_enum";
