-- AlterEnum
ALTER TYPE "public"."application_accessible" ADD VALUE 'PILOTE_EVAL_PILOTAGE';

-- AlterTable
ALTER TABLE "public"."etape_evaluation" ADD COLUMN     "read_only" BOOLEAN NOT NULL DEFAULT false;
