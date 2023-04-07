/*
  Warnings:

  - The primary key for the `commentaire` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "commentaire_id_seq";
