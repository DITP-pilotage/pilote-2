/*
  Warnings:

  - Added the required column `projet_structurant_id` to the `indicateur_projet_structurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."indicateur_projet_structurant" ADD COLUMN     "projet_structurant_id" TEXT NOT NULL;
