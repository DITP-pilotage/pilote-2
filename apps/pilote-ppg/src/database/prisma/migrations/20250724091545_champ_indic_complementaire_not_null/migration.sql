-- Update existing data
UPDATE "raw_data"."metadata_indicateurs_complementaire" SET "couverture_temporelle" = 'continue', "maille_pilotage" = '_';

-- AlterTable
ALTER TABLE "raw_data"."metadata_indicateurs_complementaire" DROP COLUMN "cible_attendue",
ADD COLUMN     "cible_attendue" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "couverture_temporelle" SET NOT NULL,
ALTER COLUMN "maille_pilotage" SET NOT NULL;
