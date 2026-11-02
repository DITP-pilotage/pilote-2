-- Cloisonnement (POC dimensions, M1‴) : mode explicite et fail-closed. Une
-- permission restreinte sans ligne de périmètre ne permet aucune écriture.
-- AlterTable
ALTER TABLE "indicateur_permission" ADD COLUMN     "perimetre_restreint" BOOLEAN NOT NULL DEFAULT false;

