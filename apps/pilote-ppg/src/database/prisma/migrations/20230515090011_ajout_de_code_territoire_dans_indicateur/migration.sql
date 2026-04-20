/*
  Warnings:

  - Added the required column `territoire_code` to the `indicateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."indicateur" ADD COLUMN "territoire_code" TEXT;

UPDATE indicateur
SET territoire_code = CONCAT(maille, '-', code_insee);

ALTER TABLE "public"."indicateur" ALTER COLUMN "territoire_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."indicateur" ADD CONSTRAINT "indicateur_territoire_code_fkey" FOREIGN KEY ("territoire_code") REFERENCES "public"."territoire"("code") ON DELETE CASCADE ON UPDATE CASCADE;
