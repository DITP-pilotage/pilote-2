-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'VALEUR_UNITAIRE';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MILLIONS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'ETP';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'ETPT';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'HEURES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MINUTES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'JOURS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MOIS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'HECTARES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'METRE';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'KILOMETRE';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'METRE_CARRE';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'KILOMETRE_CARRE';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'POINTS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'EURO';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MILLIONS_EUROS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MILLIARDS_EUROS';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'MEGAWATT';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'GIGAWATT';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'TONNES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'TONNES_CO2';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'TERAWATT';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'LITRES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'ELEVES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'CLASSES';
ALTER TYPE "unite_indicateur_enum" ADD VALUE 'REPAS';
