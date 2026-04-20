/*
  Warnings:

  - The primary key for the `objectif_projet_structurant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `territoire_id` on the `objectif_projet_structurant` table. All the data in the column will be lost.
  - You are about to drop the column `territoire_id` on the `synthese_des_resultats_projet_structurant` table. All the data in the column will be lost.
  - Added the required column `id` to the `objectif_projet_structurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `objectif_projet_structurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."objectif_projet_structurant" DROP CONSTRAINT "objectif_projet_structurant_pkey",
DROP COLUMN "territoire_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "objectif_projet_structurant_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats_projet_structurant" DROP COLUMN "territoire_id";
