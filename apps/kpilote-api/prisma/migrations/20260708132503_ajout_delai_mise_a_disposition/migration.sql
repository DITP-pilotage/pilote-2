-- CreateEnum
CREATE TYPE "unite_duree_enum" AS ENUM ('JOURS', 'SEMAINES', 'MOIS', 'ANNEES');

-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN     "delai_mad_nombre" INTEGER,
ADD COLUMN     "delai_mad_unite" "unite_duree_enum";
