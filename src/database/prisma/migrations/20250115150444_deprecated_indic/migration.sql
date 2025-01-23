/*
  Warnings:

  - You are about to drop the `indicateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."indicateur" DROP CONSTRAINT "indicateur_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."indicateur" CASCADE ;
