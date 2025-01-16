/*
  Warnings:

  - You are about to drop the `chantier` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."chantier" DROP CONSTRAINT "chantier_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."chantier";
