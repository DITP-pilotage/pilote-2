/*
  Warnings:

  - Made the column `maille_maj` on table `territoire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zone_id` on table `territoire` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."territoire" ALTER COLUMN "maille_maj" SET NOT NULL,
ALTER COLUMN "zone_id" SET NOT NULL;
