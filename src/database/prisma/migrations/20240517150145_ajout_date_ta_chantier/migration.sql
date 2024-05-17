/*
  Warnings:

  - Added the required column `taux_avancement_date` to the `chantier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "taux_avancement_date" TEXT NOT NULL;
