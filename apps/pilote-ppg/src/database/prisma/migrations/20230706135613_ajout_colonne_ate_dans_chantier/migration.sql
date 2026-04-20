-- CreateEnum
CREATE TYPE "public"."type_ate" AS ENUM ('ate', 'hors_ate_deconcentre', 'hors_ate_centralise');

-- AlterTable
ALTER TABLE "public"."chantier"
ADD COLUMN  "ate" "public"."type_ate";