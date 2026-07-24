-- CreateEnum
CREATE TYPE "article_centre_aide_statut_enum" AS ENUM ('ACTIF', 'CORBEILLE');

-- AlterTable
ALTER TABLE "article_centre_aide" ADD COLUMN "statut" "article_centre_aide_statut_enum" NOT NULL DEFAULT 'ACTIF';

-- CreateIndex
CREATE INDEX "article_centre_aide_statut_idx" ON "article_centre_aide"("statut");
