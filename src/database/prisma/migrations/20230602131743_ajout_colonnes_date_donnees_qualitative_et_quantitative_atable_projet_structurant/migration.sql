/*
  Warnings:

  - Added the required column `date_donnees_qualitative` to the `projet_structurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_donnees_quantitative` to the `projet_structurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."projet_structurant" ADD COLUMN     "date_donnees_qualitative" TIMESTAMP NOT NULL,
ADD COLUMN     "date_donnees_quantitative" TIMESTAMP NOT NULL;
