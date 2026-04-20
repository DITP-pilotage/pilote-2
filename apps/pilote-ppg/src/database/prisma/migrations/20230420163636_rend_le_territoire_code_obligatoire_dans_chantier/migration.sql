/*
  Warnings:

  - Made the column `territoire_code` on table `chantier` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."chantier" ALTER COLUMN "territoire_code" SET NOT NULL;
