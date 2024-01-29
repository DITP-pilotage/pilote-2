/*
  Warnings:

  - Made the column `acronyme` on table `ministere` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ministere" ALTER COLUMN "acronyme" SET NOT NULL;
