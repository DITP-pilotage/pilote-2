/*
  Warnings:

  - Changed the type of `type` on the `objectif_projet_structurant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."type_objectif_projet_structurant" AS ENUM ('suivi_des_objectifs');

-- AlterTable
ALTER TABLE "public"."objectif_projet_structurant" DROP COLUMN "type",
ADD COLUMN     "type" "public"."type_objectif_projet_structurant" NOT NULL;
