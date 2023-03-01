/*
  Warnings:

  - The primary key for the `synthese_des_resultats` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "synthese_des_resultats_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "synthese_des_resultats_id_seq";
