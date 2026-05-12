-- AlterTable
ALTER TABLE "valeur_avancement"
  ALTER COLUMN "valeur" SET DATA TYPE NUMERIC(20, 2) USING ROUND("valeur"::NUMERIC, 2);
