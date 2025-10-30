/*
  Warnings:

  - Added the required column `jalon` to the `chantier_evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jalon` to the `indicateur_evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."chantier_evaluation" ADD COLUMN     "jalon" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."indicateur_evaluation" ADD COLUMN     "jalon" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."chantier_evaluation" ADD CONSTRAINT "chantier_evaluation_territoire_code_jalon_fkey" FOREIGN KEY ("territoire_code", "jalon") REFERENCES "public"."fiche_evaluation"("rattachement_code", "jalon") ON DELETE CASCADE ON UPDATE CASCADE;
