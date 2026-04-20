-- CreateEnum
CREATE TYPE "public"."type_critere" AS ENUM ('COMMUNICATION', 'FEUILLE_DE_ROUTE', 'SERVICES_PUBLICS', 'SIMPLIFICATION');

-- AlterTable
ALTER TABLE "public"."referentiel_critere" ADD COLUMN     "type" "public"."type_critere" NOT NULL DEFAULT 'COMMUNICATION';
