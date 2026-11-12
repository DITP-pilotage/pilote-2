-- CreateEnum
CREATE TYPE "sens_souhaite_enum" AS ENUM ('HAUSSE', 'BAISSE');

-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN "sens_souhaite" "sens_souhaite_enum" NOT NULL DEFAULT 'HAUSSE';
