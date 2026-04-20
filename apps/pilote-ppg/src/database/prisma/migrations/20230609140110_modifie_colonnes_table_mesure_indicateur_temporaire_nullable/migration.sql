-- AlterTable
ALTER TABLE "public"."mesure_indicateur_temporaire" ALTER COLUMN "indic_id" DROP NOT NULL,
ALTER COLUMN "zone_id" DROP NOT NULL,
ALTER COLUMN "metric_date" DROP NOT NULL,
ALTER COLUMN "metric_type" DROP NOT NULL,
ALTER COLUMN "metric_value" DROP NOT NULL;
