-- AlterTable
ALTER TABLE "raw_data"."metadata_chantiers"
DROP COLUMN IF EXISTS "porteur_shorts_noDAC",
DROP COLUMN IF EXISTS "porteur_shorts_DAC";
