-- CreateEnum
CREATE TYPE "public"."type_tendance" AS ENUM ('HAUSSE', 'BAISSE', 'STAGNATION');

-- AlterTable
ALTER TABLE "public"."chantier" ADD COLUMN     "derniere_maj_date_qualitative" DATE,
ADD COLUMN     "tendance" "public"."type_tendance";

ALTER TABLE "public"."chantier" ADD COLUMN     "ecart" DOUBLE PRECISION;
ALTER TABLE "public"."chantier" ADD COLUMN     "tendance_ecart" DOUBLE PRECISION;

