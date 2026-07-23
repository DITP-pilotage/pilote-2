-- AlterTable
ALTER TABLE "article_centre_aide" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "article_centre_aide_deleted_at_idx" ON "article_centre_aide"("deleted_at");
