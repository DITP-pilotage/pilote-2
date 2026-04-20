-- CreateEnum
CREATE TYPE "public"."type_statut" AS ENUM ('BROUILLON', 'PUBLIE', 'NON_PUBLIE');

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "statut" "public"."type_statut" NOT NULL DEFAULT 'PUBLIE';
