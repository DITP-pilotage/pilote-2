/*
  Warnings:

  - Added the required column `chantier_id` to the `indicateur_territoire` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."indicateur_territoire" ADD COLUMN     "chantier_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."indicateur_territoire" ADD CONSTRAINT "indicateur_territoire_chantier_id_territoire_code_fkey" FOREIGN KEY ("chantier_id", "territoire_code") REFERENCES "public"."chantier_territoire"("id", "territoire_code") ON DELETE CASCADE ON UPDATE CASCADE;
