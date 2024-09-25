/*
  Warnings:

  - You are about to drop the column `ppg` on the `chantier` table. All the data in the column will be lost.
  - You are about to drop the `ppg` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier" DROP COLUMN "ppg";

-- DropTable
DROP TABLE "public"."ppg";
