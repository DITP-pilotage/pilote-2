-- CreateEnum
CREATE TYPE "visibilite_enum" AS ENUM ('PUBLIC', 'PRIVE');

-- AlterTable (add nullable column to allow backfill)
ALTER TABLE "indicateur" ADD COLUMN "visibilite" "visibilite_enum";

-- Backfill existing rows as PRIVE
UPDATE "indicateur" SET "visibilite" = 'PRIVE' WHERE "visibilite" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "indicateur" ALTER COLUMN "visibilite" SET NOT NULL;
