/*
  Warnings:

  - You are about to drop the `indicateur_territoire` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire" DROP CONSTRAINT "indicateur_territoire_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire" DROP CONSTRAINT "indicateur_territoire_territoire_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."indicateur_territoire_jalon" DROP CONSTRAINT "indicateur_territoire_jalon_id_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."indicateur_territoire";
