-- AlterTable
ALTER TABLE "raw_data"."metadata_chantiers"
DROP COLUMN IF EXISTS "porteur_shorts_noDAC",
DROP COLUMN IF EXISTS "porteur_shorts_DAC";

-- AlterTable
ALTER TABLE "raw_data"."metadata_zonegroup"
ADD COLUMN IF NOT EXISTS "zg_name" TEXT,
ADD COLUMN IF NOT EXISTS "zg_desc" TEXT;
