-- CreateEnum
CREATE TYPE "public"."type_statut_indicateur" AS ENUM ('PUBLIE', 'SUPPRIME');

-- AlterTable
ALTER TABLE "public"."indicateur_identite" ADD COLUMN     "statut" "public"."type_statut_indicateur" NOT NULL DEFAULT 'PUBLIE';
