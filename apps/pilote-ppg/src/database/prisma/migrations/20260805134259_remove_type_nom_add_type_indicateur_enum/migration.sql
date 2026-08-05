/*
  Warnings:

  - You are about to drop the column `type_nom` on the `indicateur_identite` table. All the data in the column will be lost.
  - You are about to drop the `metadata_indicateur_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type_id` to the `indicateur_identite` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TypeIndicateur" AS ENUM ('IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE');

-- AlterTable
ALTER TABLE "public"."indicateur_identite"
DROP COLUMN "type_nom",
ALTER COLUMN "type_id" TYPE "public"."TypeIndicateur" USING "type_id"::"public"."TypeIndicateur",
ALTER COLUMN "type_id" SET NOT NULL;

-- DropTable
DROP TABLE "raw_data"."metadata_indicateur_types";
