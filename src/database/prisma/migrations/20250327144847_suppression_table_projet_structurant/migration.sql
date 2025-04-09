/*
  Warnings:

  - You are about to drop the column `projets_structurants_lecture_meme_perimetres_que_chantiers` on the `profil` table. All the data in the column will be lost.
  - You are about to drop the column `projets_structurants_lecture_meme_territoires_que_chantiers` on the `profil` table. All the data in the column will be lost.
  - You are about to drop the column `projets_structurants_lecture_tous_perimetres` on the `profil` table. All the data in the column will be lost.
  - You are about to drop the column `projets_structurants_lecture_tous_territoires` on the `profil` table. All the data in the column will be lost.
  - You are about to drop the `commentaire_projet_structurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `indicateur_projet_structurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `objectif_projet_structurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `perimetre_projet_structurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projet_structurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `synthese_des_resultats_projet_structurant` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."profil" DROP COLUMN "projets_structurants_lecture_meme_perimetres_que_chantiers",
DROP COLUMN "projets_structurants_lecture_meme_territoires_que_chantiers",
DROP COLUMN "projets_structurants_lecture_tous_perimetres",
DROP COLUMN "projets_structurants_lecture_tous_territoires";

-- DropTable
DROP TABLE "public"."commentaire_projet_structurant" CASCADE;

-- DropTable
DROP TABLE "public"."indicateur_projet_structurant" CASCADE;

-- DropTable
DROP TABLE "public"."objectif_projet_structurant" CASCADE;

-- DropTable
DROP TABLE "public"."perimetre_projet_structurant" CASCADE;

-- DropTable
DROP TABLE "public"."projet_structurant" CASCADE;

-- DropTable
DROP TABLE "public"."synthese_des_resultats_projet_structurant" CASCADE;

-- DropEnum
DROP TYPE "public"."type_objectif_projet_structurant" CASCADE;
