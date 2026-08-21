-- soft delete sur les trois tables référentiels
ALTER TABLE "raw_data"."metadata_porteurs"   ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE "raw_data"."metadata_perimetres" ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE "raw_data"."metadata_zonegroup"  ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- suppression de la colonne morte per_porteur_name_short
ALTER TABLE "raw_data"."metadata_perimetres" DROP COLUMN "per_porteur_name_short";

-- migration zg_zones TEXT → TEXT[]
ALTER TABLE "raw_data"."metadata_zonegroup"
  ALTER COLUMN "zg_zones" TYPE TEXT[]
  USING string_to_array("zg_zones", ' | ');
