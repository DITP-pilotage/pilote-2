/*
  Warnings:

  - You are about to drop the `indicateur_territoire_jalon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire_jalon" DROP CONSTRAINT "indicateur_territoire_jalon_id_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."indicateur_territoire_jalon";
