-- AlterTable
ALTER TABLE "public"."etape_evaluation" ADD COLUMN     "criteres_valides" BOOLEAN DEFAULT false,
ADD COLUMN     "objectifs_valides" BOOLEAN DEFAULT false;
