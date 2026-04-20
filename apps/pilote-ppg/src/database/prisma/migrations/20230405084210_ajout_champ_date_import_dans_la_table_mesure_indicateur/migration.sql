-- AlterTable
ALTER TABLE "raw_data"."mesure_indicateur" ADD COLUMN     "date_import" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
