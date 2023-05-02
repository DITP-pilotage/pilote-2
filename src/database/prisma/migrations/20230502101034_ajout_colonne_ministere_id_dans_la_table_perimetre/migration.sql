/*
  Warnings:

  - Added the required column `ministere_id` to the `perimetre` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."perimetre" ADD COLUMN     "ministere_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."perimetre" ADD CONSTRAINT "perimetre_ministere_id_fkey" FOREIGN KEY ("ministere_id") REFERENCES "public"."ministere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
