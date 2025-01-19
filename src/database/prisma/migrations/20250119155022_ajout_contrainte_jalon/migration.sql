/*
  Warnings:

  - The primary key for the `chantier_territoire_jalon` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."chantier_territoire_jalon" DROP CONSTRAINT "chantier_territoire_jalon_pkey",
ADD CONSTRAINT "chantier_territoire_jalon_pkey" PRIMARY KEY ("id", "territoire_code", "jalon");
