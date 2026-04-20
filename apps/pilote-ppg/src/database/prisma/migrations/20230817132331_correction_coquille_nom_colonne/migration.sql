/*
  Warnings:

  - You are about to drop the column `a_taux_acancement_regional` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier" DROP COLUMN "a_taux_acancement_regional",
ADD COLUMN     "a_taux_avancement_regional" BOOLEAN;
