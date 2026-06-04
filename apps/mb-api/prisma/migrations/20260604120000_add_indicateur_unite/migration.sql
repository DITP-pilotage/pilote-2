-- CreateEnum
CREATE TYPE "unite_indicateur_enum" AS ENUM ('POURCENTAGE', 'ANNEES');

-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN "unite" "unite_indicateur_enum";
