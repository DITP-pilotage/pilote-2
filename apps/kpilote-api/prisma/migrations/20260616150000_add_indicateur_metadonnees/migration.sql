-- CreateEnum
CREATE TYPE "periode_mise_a_jour_enum" AS ENUM ('QUOTIDIENNE', 'HEBDOMADAIRE', 'BIMENSUELLE', 'MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE', 'AUCUNE');

-- AlterTable
ALTER TABLE "indicateur"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "methode_calcul" TEXT,
  ADD COLUMN "source_donnees" TEXT,
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "periode_mise_a_jour" "periode_mise_a_jour_enum",
  ADD COLUMN "jour_mise_a_jour" INTEGER,
  ADD CONSTRAINT "indicateur_jour_mise_a_jour_check" CHECK ("jour_mise_a_jour" IS NULL OR ("jour_mise_a_jour" BETWEEN 1 AND 31));
