/*
  Warnings:

  - Added the required column `statut` to the `chantier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."type_statut" AS ENUM ('BROUILLON', 'PUBLIE', 'NON_PUBLIE');

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "statut" "public"."type_statut" NOT NULL;
