-- AlterTable
ALTER TABLE "public"."territoire" ADD COLUMN     "zone_id" TEXT;

ALTER TABLE "public"."territoire" ALTER COLUMN "zone_id" SET NOT NULL;
