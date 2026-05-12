-- AlterTable
ALTER TABLE "valeur_avancement"
  ALTER COLUMN "valeur" SET DATA TYPE NUMERIC USING "valeur"::NUMERIC;
