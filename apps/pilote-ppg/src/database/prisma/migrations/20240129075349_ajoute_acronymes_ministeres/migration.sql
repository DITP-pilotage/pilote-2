-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "ministeres_acronymes" TEXT[];

-- AlterTable
ALTER TABLE "public"."ministere" ADD COLUMN     "acronyme" TEXT DEFAULT 'AAA';
